const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/configDb");
const rateLimit = require("express-rate-limit");
const socket = require("./config/socket");
const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");
const app = express();

app.use(cors());
app.use(express.json());

require("dotenv").config();

connectDB(process.env.MONGO_URI);

// Rate limiting
app.use("/api/", apiLimiter);

// Apply stricter rate limiting to auth routes
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Routes

app.use("/api/users", require("./microservices/user-service/routes/userRoutes"));
app.use("/api/articles", require("./microservices/article-service/routes/articleRoutes"));
app.use("/api/comments", require("./microservices/comment-service/routes/commentRoutes"));
app.use("/api/analytics", require("./microservices/article-service/routes/analyticsRoutes"));

// User Service Routes
app.use("/api/auth", require("./microservices/user-service/routes/userRoutes"));
app.use("/api/users", require("./microservices/user-service/routes/userRoutes"));

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

// Initialize Socket.io
socket.init(server);

// Initialize WebSocket for real-time notifications
const notificationService = require("./microservices/notif-service/services/notificationService");
notificationService.initialize(server); // Pass your HTTP server instance
