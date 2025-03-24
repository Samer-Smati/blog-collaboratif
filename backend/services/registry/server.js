const express = require("express");
const ServiceRegistry = require("./ServiceRegistry");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const serviceRegistry = new ServiceRegistry();

app.use(express.json());
app.use(cors());

// Register service
app.put("/register/:serviceName/:serviceVersion/:servicePort", (req, res) => {
  const { serviceName, serviceVersion, servicePort } = req.params;
  const ip = req.socket.remoteAddress.includes("::")
    ? `[${req.socket.remoteAddress}]`
    : req.socket.remoteAddress;

  const serviceKey = serviceRegistry.register(
    serviceName,
    serviceVersion,
    ip.replace(/^.*:/, ""),
    servicePort
  );

  return res.json({ result: serviceKey });
});

// Unregister service
app.delete("/register/:serviceName/:serviceVersion/:servicePort", (req, res) => {
  const { serviceName, serviceVersion, servicePort } = req.params;
  const ip = req.socket.remoteAddress.includes("::")
    ? `[${req.socket.remoteAddress}]`
    : req.socket.remoteAddress;

  const serviceKey = serviceRegistry.unregister(
    serviceName,
    serviceVersion,
    ip.replace(/^.*:/, ""),
    servicePort
  );

  return res.json({ result: serviceKey });
});

// Find service
app.get("/find/:serviceName/:serviceVersion", (req, res) => {
  const { serviceName, serviceVersion } = req.params;

  const service = serviceRegistry.get(serviceName, serviceVersion);

  if (!service) {
    return res.status(404).json({ result: "Service not found" });
  }

  return res.json({ result: service });
});

// List all services
app.get("/services", (req, res) => {
  return res.json({ services: Object.values(serviceRegistry.services) });
});

app.listen(PORT, () => {
  console.log(`Service Registry is listening on port ${PORT}`);
});
