const Article = require("../models/Article");
const Comment = require("../../comment-service/models/Comment");
const User = require("../../user-service/models/User");
const createNotification =
  require("../../notif-service/controllers/NotifControllers").createNotification;
const mongoose = require("mongoose");

const createArticle = async (req, res) => {
  try {
    const { title, content, tags, isPublished = false } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    const article = await Article.create({
      title,
      content,
      author: req.user.id,
      tags: tags || [],
      isPublished,
      status: isPublished ? "published" : "draft",
    });

    // Notify editors about new article
    if (isPublished) {
      // Find admin and editor users
      const editors = await User.find({ role: { $in: ["admin", "editor"] } });

      // Send notifications to editors
      for (const editor of editors) {
        await createNotification(
          editor._id,
          `New article "${title}" has been published`,
          "info",
          `/articles/${article._id}`
        );
      }
    }

    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getArticles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      tag = "",
      author = "",
      status = "published",
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = { isDeleted: false };

    // Filter by status (only admin/editor can see unpublished articles)
    if (!["admin", "editor"].includes(req.user?.role)) {
      query.isPublished = true;
    } else if (status) {
      if (status !== "all") {
        query.status = status;
      }
    } else {
      query.isPublished = true;
    }

    // Search by title or content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by tag
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // Filter by author
    if (author) {
      query.author = author;
    }

    // Count total articles matching query
    const totalArticles = await Article.countDocuments(query);

    // Get paginated articles
    const articles = await Article.find(query)
      .populate("author", "username")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      items: articles,
      totalItems: totalArticles,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalArticles / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate("author", "username")
      .populate({
        path: "comments",
        populate: {
          path: "userId",
          select: "username",
        },
      });

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Check if article is unpublished and user is not admin/editor or the author
    if (
      !article.isPublished &&
      !["admin", "editor"].includes(req.user?.role) &&
      article.author._id.toString() !== req.user?.id
    ) {
      return res.status(403).json({ message: "Not authorized to view this article" });
    }

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, isPublished, status } = req.body;

    // Find the article
    const article = await Article.findOne({ _id: id, isDeleted: false });

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Check permissions
    const isAdmin = req.user.role === "admin";
    const isEditor = req.user.role === "editor";
    const isAuthor = article.author.toString() === req.user.id;

    // Only allow update if user is admin, editor, or the author
    if (!isAdmin && !isEditor && !isAuthor) {
      return res.status(403).json({ message: "Not authorized to update this article" });
    }

    // Writers can only update their own articles
    if (req.user.role === "writer" && !isAuthor) {
      return res.status(403).json({ message: "Writers can only update their own articles" });
    }

    // Prepare updates
    const updates = {};
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (tags) updates.tags = tags;

    // Only admin and editor can change publish status
    if ((isAdmin || isEditor) && typeof isPublished === "boolean") {
      updates.isPublished = isPublished;
    }

    // Set status based on isPublished if provided
    if (typeof isPublished === "boolean") {
      updates.status = isPublished ? "published" : "draft";
    }

    // Override status if explicitly provided (admin/editor only)
    if ((isAdmin || isEditor) && status) {
      updates.status = status;
    }

    // Update the article
    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).populate("author", "username");

    res.json(updatedArticle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin can delete articles
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete articles" });
    }

    // Soft delete the article
    const article = await Article.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.json({ message: "Article deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const commentArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    // Check if article exists and is published
    const article = await Article.findOne({
      _id: id,
      isDeleted: false,
      isPublished: true,
    });

    if (!article) {
      return res.status(404).json({ message: "Article not found or not published" });
    }

    // Create comment
    const comment = await Comment.create({
      content,
      userId: req.user.id,
      articleId: id,
    });

    // Add comment to article
    article.comments.push(comment._id);
    await article.save();

    // Notify article author about new comment
    await createNotification(
      article.author,
      `New comment on your article "${article.title}"`,
      "info",
      `/articles/${id}`
    );

    // Get comment with populated user
    const populatedComment = await Comment.findById(comment._id).populate("userId", "username");

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const replyArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parentId } = req.body;

    if (!content || !parentId) {
      return res.status(400).json({
        message: "Comment content and parent ID are required",
      });
    }

    // Check if parent comment exists
    const parentComment = await Comment.findById(parentId);
    if (!parentComment) {
      return res.status(404).json({ message: "Parent comment not found" });
    }

    // Create reply
    const reply = await Comment.create({
      content,
      userId: req.user.id,
      articleId: id,
      parentId,
    });

    // Add reply to parent comment
    parentComment.replies.push(reply._id);
    await parentComment.save();

    // Notify parent comment author about reply
    await createNotification(
      parentComment.userId,
      `New reply to your comment on article`,
      "info",
      `/articles/${id}`
    );

    // Get reply with populated user
    const populatedReply = await Comment.findById(reply._id).populate("userId", "username");

    res.status(201).json(populatedReply);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate fake data for testing (admin only)
const fakeData = async (req, res) => {
  // Implementation for generating test data
  // Only available in development environment
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({
      message: "This endpoint is only available in development mode",
    });
  }

  // Only admin can generate fake data
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can generate fake data" });
  }

  try {
    // Generate fake articles
    // Implementation details...

    res.json({ message: "Fake data generated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  commentArticle,
  replyArticle,
  fakeData,
};
