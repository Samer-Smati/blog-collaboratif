const express = require("express");
const router = express.Router();
const {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  commentArticle,
  replyArticle,
  fakeData,
} = require("../controllers/articleController");
const { auth, authorize } = require("../../../middleware/auth");
const { apiLimiter } = require("../../../middleware/rateLimiter");

// Get all articles (public)
router.get("/", apiLimiter, getArticles);

// Get article by ID (public)
router.get("/:id", apiLimiter, getArticleById);

// Create article (admin, editor, writer)
router.post("/", auth, authorize("admin", "editor", "writer"), createArticle);

// Update article (admin, editor, writer - with restrictions)
router.put("/:id", auth, authorize("admin", "editor", "writer"), updateArticle);

// Delete article (admin only)
router.delete("/:id", auth, authorize("admin"), deleteArticle);

// Comment on article (any authenticated user)
router.post("/:id/comment", auth, commentArticle);

// Reply to comment (any authenticated user)
router.post("/:id/reply", auth, replyArticle);

// Generate fake data (admin only, development environment)
router.post("/fake", auth, authorize("admin"), fakeData);

module.exports = router;
