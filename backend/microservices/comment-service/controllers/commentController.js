const Comment = require("../models/Comment");
const Article = require("../../article-service/models/Article");
const createNotification =
  require("../../notif-service/controllers/NotifControllers").createNotification;

const createComment = async (req, res) => {
  try {
    const { content, articleId } = req.body;

    if (!content || !articleId) {
      return res.status(400).json({ message: "Content and articleId are required" });
    }

    // Check if article exists
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    const comment = await Comment.create({
      content,
      userId: req.user.id, // Use authenticated user
      articleId,
    });

    // Add comment reference to article
    await Article.findByIdAndUpdate(articleId, {
      $push: { comments: comment._id },
    });

    // Notify article author
    await createNotification(
      article.author,
      `New comment on your article "${article.title}"`,
      "info",
      `/articles/${articleId}`
    );

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getComments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    // Get articleId from either route params or query params
    const articleId = req.params.articleId || req.query.articleId;
    const skip = (page - 1) * limit;

    if (!articleId) {
      return res.status(400).json({ message: "Article ID is required" });
    }

    const query = {
      articleId,
      parentId: null, // Only top-level comments
      isDeleted: false,
    };

    const totalItems = await Comment.countDocuments(query);
    const comments = await Comment.find(query)
      .populate("userId", "username")
      .populate({
        path: "replies",
        match: { isDeleted: false },
        populate: { path: "userId", select: "username" },
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // If we're just getting the comments without pagination info
    if (req.params.articleId) {
      return res.json(comments);
    }

    // Return with pagination info for the main comment listing
    res.json({
      items: comments,
      totalItems,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCommentById = async (req, res) => {
  try {
    const comment = await Comment.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("userId", "username")
      .populate({
        path: "replies",
        match: { isDeleted: false },
        populate: { path: "userId", select: "username" },
      });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const comment = await Comment.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Only the author or admin can update
    if (comment.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this comment" });
    }

    comment.content = content;
    await comment.save();

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Only the author or admin can delete
    if (comment.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createReply = async (req, res) => {
  try {
    const { content, articleId } = req.body;
    const parentId = req.params.id; // Get parent comment ID from URL params

    if (!content || !parentId || !articleId) {
      return res
        .status(400)
        .json({ message: "Content, parent comment ID, and article ID are required" });
    }

    // Check if parent comment exists
    const parentComment = await Comment.findOne({
      _id: parentId,
      isDeleted: false,
    });

    if (!parentComment) {
      return res.status(404).json({ message: "Parent comment not found" });
    }

    const reply = await Comment.create({
      content,
      userId: req.user.id,
      articleId,
      parentId,
    });

    // Add reply to parent comment
    parentComment.replies.push(reply._id);
    await parentComment.save();

    // Notify parent comment author
    await createNotification(
      parentComment.userId,
      "Someone replied to your comment",
      "info",
      `/articles/${articleId}`
    );

    res.status(201).json(reply);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReplies = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const parentId = req.params.id; // Get parent comment ID from URL params
    const skip = (page - 1) * limit;

    if (!parentId) {
      return res.status(400).json({ message: "Parent comment ID is required" });
    }

    const query = {
      parentId,
      isDeleted: false,
    };

    const totalItems = await Comment.countDocuments(query);
    const replies = await Comment.find(query)
      .populate("userId", "username")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      items: replies,
      totalItems,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createComment,
  getComments,
  getCommentById,
  updateComment,
  deleteComment,
  createReply,
  getReplies,
};
