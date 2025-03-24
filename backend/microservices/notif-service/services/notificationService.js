const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const url = require("url");

class NotificationService {
  constructor() {
    this.connections = new Map();
  }

  initialize(server) {
    const wss = new WebSocket.Server({
      server,
      verifyClient: this.verifyClient,
    });

    console.log("WebSocket server initialized for notifications");

    wss.on("connection", (ws, req) => {
      try {
        // Extract token from query string
        const params = url.parse(req.url, true).query;
        const token = params.token;

        if (!token) {
          ws.close(4001, "Authentication token required");
          return;
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        console.log(`WebSocket connection established for user ${userId}`);

        // Store connection by user ID
        this.connections.set(userId, ws);

        // Handle disconnection
        ws.on("close", () => {
          console.log(`WebSocket connection closed for user ${userId}`);
          this.connections.delete(userId);
        });

        // Send confirmation to client
        ws.send(
          JSON.stringify({ type: "connected", message: "Connected to notification service" })
        );
      } catch (error) {
        console.error("WebSocket connection error:", error);
        ws.close(4002, "Authentication failed");
      }
    });
  }

  verifyClient(info, callback) {
    // Optionally implement additional verification
    callback(true);
  }

  notifyUser(userId, notification) {
    const connection = this.connections.get(userId);

    if (connection && connection.readyState === WebSocket.OPEN) {
      try {
        connection.send(
          JSON.stringify({
            type: "notification",
            data: notification,
          })
        );
        console.log(`Notification sent to user ${userId}`);
        return true;
      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
        return false;
      }
    } else {
      console.log(`User ${userId} is not connected via WebSocket`);
      return false;
    }
  }

  broadcastToRole(role, data) {
    // Implement broadcasting to users with specific role
    // This would require maintaining a mapping of user roles
  }
}

module.exports = new NotificationService();
