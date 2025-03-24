const express = require("express");
const httpProxy = require("http-proxy");
const axios = require("axios");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 3000;
const REGISTRY_URL = process.env.REGISTRY_URL || "http://localhost:3000";

// Create proxy server
const proxy = httpProxy.createProxyServer();

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("combined"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

app.use(limiter);

// Forward requests to appropriate microservice
app.use("/:serviceName", async (req, res) => {
  const { serviceName } = req.params;
  const serviceVersion = req.get("service-version") || "1.0.0";

  try {
    // Get service from registry
    const response = await axios.get(`${REGISTRY_URL}/find/${serviceName}/${serviceVersion}`);

    const service = response.data.result;
    const serviceUrl = `http://${service.ip}:${service.port}`;

    // Proxy the request
    proxy.web(req, res, { target: serviceUrl, changeOrigin: true }, (err) => {
      if (err) {
        console.error("Proxy error:", err);
        res.status(500).json({ error: "Service unavailable" });
      }
    });
  } catch (error) {
    console.error("Service discovery error:", error);
    res.status(404).json({ error: `Service ${serviceName} not found` });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Gateway error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`API Gateway is listening on port ${PORT}`);
});
