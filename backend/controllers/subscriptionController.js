const webpush = require("web-push");
const Subscription = require("../models/subscription");
const config = require("../config");

// Set VAPID keys
webpush.setVapidDetails("mailto:admin@yourblog.com", config.vapidPublicKey, config.vapidPrivateKey);

// Store a new subscription
exports.subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({
      endpoint: subscription.endpoint,
      userId: req.userId,
    });

    if (existingSubscription) {
      return res.status(200).json({
        success: true,
        message: "Subscription already exists",
      });
    }

    // Create new subscription
    const newSubscription = new Subscription({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userId: req.userId,
    });

    await newSubscription.save();

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error subscribing to push notifications",
      error: error.message,
    });
  }
};

// Remove a subscription
exports.unsubscribe = async (req, res) => {
  try {
    const endpoint = req.params.endpoint;

    await Subscription.deleteOne({
      endpoint,
      userId: req.userId,
    });

    res.status(200).json({
      success: true,
      message: "Subscription removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error unsubscribing from push notifications",
      error: error.message,
    });
  }
};

// Send push notification to a specific user
exports.sendNotificationToUser = async (userId, title, body, url = "") => {
  try {
    const subscriptions = await Subscription.find({ userId });

    if (!subscriptions.length) {
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: "/assets/icons/icon-128x128.png",
    });

    // Send notification to all user's subscriptions
    const promises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
          payload
        );
      } catch (error) {
        console.error("Error sending push notification:", error);

        // Remove expired subscriptions
        if (error.statusCode === 410) {
          await Subscription.deleteOne({ _id: subscription._id });
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("Error sending push notification to user:", error);
  }
};

// Send notification to multiple users
exports.sendNotificationToUsers = async (userIds, title, body, url = "") => {
  try {
    for (const userId of userIds) {
      await exports.sendNotificationToUser(userId, title, body, url);
    }
  } catch (error) {
    console.error("Error sending push notification to users:", error);
  }
};
