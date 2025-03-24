const webPushService = require("../services/webPushService");
const User = require("../../user-service/models/User");

// In-memory subscription store (should be in a database in production)
const subscriptions = new Map();

const getVapidPublicKey = async (req, res) => {
  try {
    res.json({ publicKey: webPushService.getPublicKey() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({ message: "Subscription object is required" });
    }

    // Store subscription by user ID
    subscriptions.set(req.user.id, subscription);

    // In a production app, save to database
    await User.findByIdAndUpdate(req.user.id, {
      $set: { pushSubscription: subscription },
    });

    res.status(201).json({ message: "Successfully subscribed to push notifications" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unsubscribe = async (req, res) => {
  try {
    // Remove subscription
    subscriptions.delete(req.user.id);

    // In a production app, remove from database
    await User.findByIdAndUpdate(req.user.id, {
      $unset: { pushSubscription: "" },
    });

    res.json({ message: "Successfully unsubscribed from push notifications" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send push notification to a user
const sendPushNotification = async (userId, payload) => {
  try {
    // Get subscription from database in production
    const user = await User.findById(userId);
    const subscription = user.pushSubscription || subscriptions.get(userId);

    if (!subscription) {
      return false;
    }

    return await webPushService.sendNotification(subscription, payload);
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return false;
  }
};

// Test endpoint to send a push notification
const testPush = async (req, res) => {
  try {
    const success = await sendPushNotification(req.user.id, {
      title: "Test Notification",
      body: "This is a test push notification",
      icon: "/assets/icons/icon-192x192.png",
      data: {
        url: "/notifications",
      },
    });

    if (success) {
      res.json({ message: "Push notification sent successfully" });
    } else {
      res.status(400).json({ message: "Failed to send push notification" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  testPush,
  sendPushNotification,
};
