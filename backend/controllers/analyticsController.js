const Article = require("../models/article");
const Comment = require("../models/comment");
const User = require("../models/user");
const mongoose = require("mongoose");
const { Parser } = require("json2csv");

exports.getArticleStats = async (req, res) => {
  try {
    const totalArticles = await Article.countDocuments();
    const totalComments = await Comment.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        totalArticles,
        totalComments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching article statistics",
      error: error.message,
    });
  }
};

exports.getPopularArticles = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const popularArticles = await Article.find()
      .sort({ viewCount: -1 })
      .limit(limit)
      .populate("author", "username");

    res.status(200).json({
      success: true,
      popularArticles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching popular articles",
      error: error.message,
    });
  }
};

exports.getArticlesByTag = async (req, res) => {
  try {
    const tagStats = await Article.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      tagStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching articles by tag",
      error: error.message,
    });
  }
};

exports.getArticleGrowth = async (req, res) => {
  try {
    const months = 6; // Last 6 months

    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - months);

    const articleGrowth = await Article.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [{ $toString: "$_id.month" }, "/", { $toString: "$_id.year" }],
          },
          count: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      articleGrowth,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching article growth data",
      error: error.message,
    });
  }
};

exports.exportArticleStats = async (req, res) => {
  try {
    const format = req.query.format || "csv";

    const articles = await Article.find()
      .select("title author viewCount commentsCount createdAt tags")
      .populate("author", "username");

    if (format === "json") {
      return res.status(200).json({
        success: true,
        data: articles,
      });
    }

    // CSV export
    const fields = [
      { label: "Title", value: "title" },
      { label: "Author", value: "author.username" },
      { label: "Views", value: "viewCount" },
      { label: "Comments", value: "commentsCount" },
      { label: "Created Date", value: "createdAt" },
      { label: "Tags", value: (row) => row.tags.join(", ") },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(articles);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=article-stats.csv");
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error exporting article statistics",
      error: error.message,
    });
  }
};
