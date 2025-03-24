const Article = require("../models/Article");

const analyticsController = {
  async getArticleStats(req, res) {
    try {
      const stats = await Article.aggregate([
        {
          $group: {
            _id: null,
            totalArticles: { $sum: 1 },
            totalComments: {
              $sum: {
                $add: [
                  { $size: "$comments" },
                  {
                    $sum: {
                      $map: {
                        input: "$comments",
                        as: "comment",
                        in: { $size: "$$comment.replies" },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      ]);

      res.json({
        stats: stats[0] || {
          totalArticles: 0,
          totalComments: 0,
        },
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async getPopularArticles(req, res) {
    try {
      const popularArticles = await Article.find()
        .limit(5)
        .populate("author", "username")
        .select("title");

      res.json({ popularArticles });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async getArticlesByTag(req, res) {
    try {
      const tagStats = await Article.aggregate([
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      res.json({ tagStats });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async getArticleGrowth(req, res) {
    try {
      const today = new Date();
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);

      const articleGrowth = await Article.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      res.json({ articleGrowth });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async getArticlesByUser(req, res) {
    try {
      const authorStats = await Article.aggregate([
        { $match: { isDeleted: false, isPublished: true } },
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorInfo",
          },
        },
        { $unwind: "$authorInfo" },
        {
          $group: {
            _id: {
              authorId: "$authorInfo._id",
              username: "$authorInfo.username",
              role: "$authorInfo.role",
            },
            articleCount: { $sum: 1 },
            totalComments: { $sum: { $size: "$comments" } },
          },
        },
        { $sort: { articleCount: -1 } },
        { $limit: 10 },
      ]);

      res.json({ authorStats });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
};

module.exports = analyticsController;
