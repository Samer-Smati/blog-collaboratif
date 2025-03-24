const express = require("express");
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  sendNotification,
  deleteNotification,
} = require("../controllers/notifController");
const { auth, authorize } = require("../../../middleware/auth");

// Get user's notifications
router.get("/", auth, getNotifications);

// Get unread notification count
router.get("/unread/count", auth, getUnreadCount);

// Mark notification as read
router.patch("/:id/read", auth, markAsRead);

// Mark all notifications as read
router.patch("/read-all", auth, markAllAsRead);

// Send a notification (admin and editors only)
router.post("/send", auth, authorize("admin", "editor"), sendNotification);

// Delete notification
router.delete("/:id", auth, deleteNotification);

module.exports = router;
