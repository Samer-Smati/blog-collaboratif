const express = require("express");
const cors = require("cors");
const connectDB = require("./config/configDb");
const socket = require("./config/socket");
const notificationService = require("./microservices/notif-service/services/notificationService");
const cookieParser = require("cookie-parser");
const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");
const app = express();
// Set cookie defaults
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/",
  domain: "localhost",
};
app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 3600,
    cookieOptions,
  })
);

// Cookie parser middleware
app.use(cookieParser());

app.use(express.json());

require("dotenv").config();

connectDB(process.env.MONGO_URI);

// Rate limiting
app.use("/api/", apiLimiter);

// User Service Routes
app.use("/api/auth", require("./microservices/user-service/routes/userRoutes"));
app.use("/api/users", require("./microservices/user-service/routes/userRoutes"));
app.use("/api/admin", require("./microservices/user-service/routes/adminRoutes"));

// Article Service Routes
app.use("/api/articles", require("./microservices/article-service/routes/articleRoutes"));
app.use("/api/analytics", require("./microservices/article-service/routes/analyticsRoutes"));

// Comment Service Routes
app.use("/api/comments", require("./microservices/comment-service/routes/commentRoutes"));

// Notification Service Routes
app.use("/api/notifications", require("./microservices/notif-service/routes/notifRoutes"));
app.use("/api/push", require("./microservices/notif-service/routes/pushRoutes"));

const PORT = process.env.PORT || 5000;
const server = app
  .listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
  })
  .on("error", (err) => {
    console.log(err);
  });

// Initialize Socket.IO
const io = socket.init(server);

// Initialize notification service with Socket.IO instance
notificationService.initialize(io);
