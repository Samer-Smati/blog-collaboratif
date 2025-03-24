const webpush = require("web-push");
const Notification = require("../models/Notification");
const notificationService = require("../services/notificationService");

// Check if VAPID keys are defined
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.warn(
    "VAPID keys not found in environment variables, web push functionality will not work"
  );
} else {
  // Configure web-push with existing VAPID keys
  webpush.setVapidDetails(
    "mailto:admin@blogplatform.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Store subscriptions in memory (in production, this should be in a database)
const subscriptions = new Map();

const notificationController = {
  async subscribe(req, res) {
    try {
      const { subscription, userId } = req.body;

      if (!subscription || !userId) {
        return res.status(400).json({ message: "Subscription and userId are required" });
      }

      subscriptions.set(userId, subscription);

      res.status(201).json({ message: "Subscription added successfully" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async sendNotification(req, res) {
    try {
      const { userId, title, body, url } = req.body;

      if (!userId || !title || !body) {
        return res.status(400).json({ message: "userId, title, and body are required" });
      }

      const subscription = subscriptions.get(userId);

      if (!subscription) {
        return res.status(404).json({ message: "No subscription found for this user" });
      }

      const payload = JSON.stringify({
        title,
        body,
        url: url || "",
        timestamp: new Date().getTime(),
      });

      await webpush.sendNotification(subscription, payload);
      createNotification(userId, title, body, url);
      res.json({ message: "Notification sent successfully" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(20);

      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      await Notification.updateMany({ userId, read: false }, { read: true });

      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

// Function to create a notification and send it in real-time
const createNotification = async (userId, body, type = "info", link = null) => {
  try {
    // Save to database
    const notification = await Notification.create({
      userId,
      body,
      type,
      link,
    });

    // Send via WebSocket if user is connected
    notificationService.notifyUser(userId, notification);

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
};

module.exports = { notificationController, createNotification };
