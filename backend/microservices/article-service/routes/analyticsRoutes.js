const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { auth, requirePermission } = require("../../../middleware/roleBaseAcessCntrol");

// Get article stats (admin and editor only)
router.get("/stats", auth, requirePermission("manage_users"), analyticsController.getArticleStats);
router.get(
  "/articles/stats",
  auth,
  requirePermission(["admin", "editor"]),
  analyticsController.getArticleStats
);

// Get popular articles
router.get(
  "/popular",
  auth,
  requirePermission(["admin", "editor"]),
  analyticsController.getPopularArticles
);
router.get(
  "/articles/popular",
  auth,
  requirePermission(["admin", "editor"]),
  analyticsController.getPopularArticles
);

// Get articles by tag
router.get(
  "/tags",
  auth,
  requirePermission(["admin", "editor"]),
  analyticsController.getArticlesByTag
);
router.get(
  "/articles/by-tag",
  auth,
  requirePermission(["admin", "editor"]),
  analyticsController.getArticlesByTag
);

// Get article growth over time
router.get(
  "/growth",
  auth,
  requirePermission(["admin", "editor"]),
  analyticsController.getArticleGrowth
);
router.get(
  "/articles/growth",
  auth,
  requirePermission(["admin", "editor"]),
  analyticsController.getArticleGrowth
);

// Get articles by user
router.get(
  "/by-user",
  auth,
  requirePermission(["admin", "editor"]),
  analyticsController.getArticlesByUser
);

// Export article stats
router.get(
  "/articles/export",
  auth,
  requirePermission(["admin", "editor"]),
  analyticsController.exportArticleStats
);

router.get(
  "/comments/stats",
  auth,
  requirePermission(["admin", "editor"]),
  analyticsController.getCommentStats
);

module.exports = router;
