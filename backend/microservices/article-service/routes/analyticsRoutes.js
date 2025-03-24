const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { auth, authorize } = require("../../../middleware/auth");

// Get article stats (admin and editor only)
router.get("/stats", auth, authorize("admin", "editor"), analyticsController.getArticleStats);

// Get popular articles
router.get("/popular", auth, authorize("admin", "editor"), analyticsController.getPopularArticles);

// Get articles by tag
router.get("/tags", auth, authorize("admin", "editor"), analyticsController.getArticlesByTag);

// Get article growth over time
router.get("/growth", auth, authorize("admin", "editor"), analyticsController.getArticleGrowth);

// Get articles by user
router.get("/by-user", auth, authorize("admin", "editor"), analyticsController.getArticlesByUser);

module.exports = router;
