const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");

class NotificationService {
  constructor() {
    this.connections = new Map();
  }

  initialize(io) {
    console.log("Socket.IO server initialized for notifications");

    io.on("connection", (socket) => {
      try {
        // Extract token from query string
        const token = socket.handshake.query.token;

        if (!token) {
          socket.disconnect();
          return;
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        console.log(`Socket.IO connection established for user ${userId}`);

        // Store connection by user ID
        this.connections.set(userId, socket);

        // Handle disconnection
        socket.on("disconnect", () => {
          console.log(`Socket.IO connection closed for user ${userId}`);
          this.connections.delete(userId);
        });

        // Send confirmation to client
        socket.emit("connected", { message: "Connected to notification service" });
      } catch (error) {
        console.error("Socket.IO connection error:", error);
        socket.disconnect();
      }
    });
  }

  notifyUser(userId, notification) {
    const socket = this.connections.get(userId);

    if (socket && socket.connected) {
      try {
        socket.emit("notification", {
          type: "notification",
          data: notification,
        });
        console.log(`Notification sent to user ${userId}`);
        return true;
      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
        return false;
      }
    } else {
      console.log(`User ${userId} is not connected via Socket.IO`);
      return false;
    }
  }

  broadcastToRole(role, data) {
    // Implement broadcasting to users with specific role
    // This would require maintaining a mapping of user roles
  }
}

module.exports = new NotificationService();
