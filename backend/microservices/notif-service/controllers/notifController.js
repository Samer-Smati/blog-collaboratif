const Notification = require("../models/Notification");
const notificationService = require("../services/notificationService");

const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, read } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };

    // Filter by read status if provided
    if (read !== undefined) {
      query.read = read === "true";
    }

    const totalItems = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      items: notifications,
      totalItems,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      read: false,
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if notification belongs to user
    const notification = await Notification.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.json({
      message: "All notifications marked as read",
      count: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendNotification = async (req, res) => {
  try {
    const { userId, body, type = "info", link } = req.body;

    // Only admin and editors can send notifications to others
    if (userId !== req.user.id && !["admin", "editor"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Not authorized to send notifications to other users" });
    }

    const notification = await Notification.create({
      userId,
      body,
      type,
      link,
    });

    // Send real-time notification via WebSocket
    notificationService.notifyUser(userId, notification);

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if notification belongs to user
    const notification = await Notification.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.deleteOne();

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create notification helper function used by other services
const createNotification = async (userId, body, type = "info", link = null) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      userId,
      body,
      type,
      link,
    });

    // Send real-time notification via WebSocket
    notificationService.notifyUser(userId, notification);

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  sendNotification,
  deleteNotification,
  createNotification,
};
