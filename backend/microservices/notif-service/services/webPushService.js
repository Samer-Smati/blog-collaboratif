const webPush = require("web-push");

class WebPushService {
  constructor() {
    // In production, keys should be stored in environment variables
    const vapidKeys =
      process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
        ? {
            publicKey: process.env.VAPID_PUBLIC_KEY,
            privateKey: process.env.VAPID_PRIVATE_KEY,
          }
        : webPush.generateVAPIDKeys();

    this.publicKey = vapidKeys.publicKey;
    this.privateKey = vapidKeys.privateKey;

    // Show keys in console during development to save for later use
    if (
      process.env.NODE_ENV === "development" &&
      (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY)
    ) {
      console.log("Generated VAPID Keys - save these in your environment variables:");
      console.log(`VAPID_PUBLIC_KEY=${this.publicKey}`);
      console.log(`VAPID_PRIVATE_KEY=${this.privateKey}`);
    }

    // Set VAPID details
    webPush.setVapidDetails(
      "mailto:contact@yourblogapp.com", // Contact info
      this.publicKey,
      this.privateKey
    );
  }

  getPublicKey() {
    return this.publicKey;
  }

  async sendNotification(subscription, payload) {
    try {
      await webPush.sendNotification(
        subscription,
        typeof payload === "string" ? payload : JSON.stringify(payload)
      );
      return true;
    } catch (error) {
      console.error("Error sending push notification:", error);
      return false;
    }
  }
}

module.exports = new WebPushService();
