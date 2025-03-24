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
  searchArticles,
  fakeData,
  changeStatus,
  getAllTags,
} = require("../controllers/articleController");
const { auth, requirePermission } = require("../../../middleware/roleBaseAcessCntrol");

// Get all articles (public)
router.get("/", auth, requirePermission(["admin", "editor", "writer"]), getArticles);

// Search articles (public)
router.get("/search", auth, requirePermission(["admin", "editor", "writer"]), searchArticles);

// Get all tags - new endpoint that avoids ObjectId errors
router.get("/all-tags", getAllTags);

// Get article by ID (public)
router.get("/:id", auth, requirePermission(["admin", "editor", "writer"]), getArticleById);

// Create article (admin, editor, writer)
router.post("/", auth, requirePermission(["admin", "editor", "writer"]), createArticle);

// Update article (admin, editor, writer - with restrictions)
router.put("/:id", auth, requirePermission(["admin", "editor", "writer"]), updateArticle);

// Delete article (admin only)
router.delete("/:id", auth, requirePermission(["admin"]), deleteArticle);

// Comment on article (any authenticated user)
router.post("/:id/comment", auth, requirePermission(["admin", "editor", "writer"]), commentArticle);

// Reply to comment (any authenticated user)
router.post("/:id/reply", auth, requirePermission(["admin", "editor", "writer"]), replyArticle);

router.get("/changeStatus/:id", auth, changeStatus);
// Generate fake data (admin only, development environment)
router.post("/fake", fakeData);

module.exports = router;
