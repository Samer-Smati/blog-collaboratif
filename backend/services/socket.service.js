const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const config = require("../config");

// Active users store
const activeUsers = new Map();

// Initialize Socket.io server
function initializeSocketServer(server) {
  const io = socketIO(server, {
    cors: {
      origin: config.clientUrl,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket.io authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error"));
    }

    jwt.verify(token, config.jwtSecret, (err, decoded) => {
      if (err) {
        return next(new Error("Authentication error"));
      }

      // Store user info in socket object
      socket.userId = decoded.userId;
      socket.username = decoded.username;

      next();
    });
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Add user to active users
    activeUsers.set(socket.userId, socket.id);

    // Join article room for real-time updates
    socket.on("join-article", ({ articleId }) => {
      socket.join(`article:${articleId}`);
      console.log(`User ${socket.userId} joined room for article ${articleId}`);
    });

    // Leave article room
    socket.on("leave-article", ({ articleId }) => {
      socket.leave(`article:${articleId}`);
      console.log(`User ${socket.userId} left room for article ${articleId}`);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
      activeUsers.delete(socket.userId);
    });
  });

  return io;
}

// Emit a new comment to all users in an article room
function emitNewComment(io, articleId, comment) {
  io.to(`article:${articleId}`).emit("new-comment", comment);
}

// Emit a comment update to all users in an article room
function emitCommentUpdate(io, articleId, comment) {
  io.to(`article:${articleId}`).emit("comment-updated", comment);
}

// Emit a comment deletion to all users in an article room
function emitCommentDeletion(io, articleId, commentId) {
  io.to(`article:${articleId}`).emit("comment-deleted", {
    articleId,
    commentId,
  });
}

// Send a personal notification to a specific user
function sendPersonalNotification(io, userId, notification) {
  const socketId = activeUsers.get(userId);

  if (socketId) {
    io.to(socketId).emit("notification", notification);
  }
}

module.exports = {
  initializeSocketServer,
  emitNewComment,
  emitCommentUpdate,
  emitCommentDeletion,
  sendPersonalNotification,
};
