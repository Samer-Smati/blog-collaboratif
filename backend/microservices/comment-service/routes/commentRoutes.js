const express = require("express");
const router = express.Router();
const {
  createComment,
  getComments,
  getCommentById,
  updateComment,
  deleteComment,
  createReply,
  getReplies,
} = require("../controllers/commentController");
const { auth } = require("../../../middleware/roleBaseAcessCntrol");
const { apiLimiter } = require("../../../middleware/rateLimiter");

// Create comment (authenticated users)
router.post("/", auth, createComment);

// Get comments for an article
router.get("/", apiLimiter, getComments);

// Get comments by article ID (this matches the frontend expectation)
router.get("/article/:articleId", apiLimiter, getComments);

// Get specific comment
router.get("/:id", apiLimiter, getCommentById);

// Update comment (author or admin)
router.put("/:id", auth, updateComment);

// Delete comment (author or admin)
router.delete("/:id", auth, deleteComment);

// Create reply to comment
router.post("/:id/reply", auth, createReply);

// Get replies for a comment
router.get("/:id/replies", apiLimiter, getReplies);

module.exports = router;
