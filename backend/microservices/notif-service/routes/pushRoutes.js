const express = require("express");
const router = express.Router();
const {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  testPush,
} = require("../controllers/pushController");
const { auth } = require("../../../middleware/auth");

// Get VAPID public key
router.get("/vapid-public-key", getVapidPublicKey);

// Subscribe to push notifications
router.post("/subscribe", auth, subscribe);

// Unsubscribe from push notifications
router.delete("/unsubscribe", auth, unsubscribe);

// Test endpoint for push notifications
router.post("/test", auth, testPush);

module.exports = router;
