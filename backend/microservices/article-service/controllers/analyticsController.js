const Comment = require("../../comment-service/models/Comment");
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
                  { $size: { $ifNull: ["$comments", []] } },
                  {
                    $sum: {
                      $map: {
                        input: "$comments",
                        as: "comment",
                        in: { $size: { $ifNull: ["$$comment.replies", []] } },
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
        { $limit: 8 }, // Limit to top 8 tags for better visualization
      ]);

      // Format the data for the frontend chart
      const formattedData = tagStats.map((item) => ({
        tag: item._id || "Uncategorized",
        count: item.count,
      }));

      res.json({ tagStats: formattedData });
    } catch (error) {
      console.error("Error getting tag statistics:", error);
      res.status(500).json({ message: error.message });
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

      // Format the data for the frontend chart
      const formattedData = articleGrowth.map((item) => {
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const monthIndex = item._id.month - 1;
        return {
          month: `${monthNames[monthIndex]} ${item._id.year}`,
          count: item.count,
        };
      });

      res.json({ articleGrowth: formattedData });
    } catch (error) {
      console.error("Error getting article growth:", error);
      res.status(500).json({ message: error.message });
    }
  },

  async getArticlesByUser(req, res) {
    try {
      const authorStats = await Article.aggregate([
        { $match: { status: "published" || "draft" } },
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

  async exportArticleStats(req, res) {
    try {
      const format = req.query.format || "csv";

      // Get all the stats data
      const stats = await Article.aggregate([
        {
          $group: {
            _id: null,
            totalArticles: { $sum: 1 },
            totalComments: { $sum: { $size: "$comments" } },
          },
        },
      ]);

      const tagStats = await Article.aggregate([
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      const articleGrowth = await Article.aggregate([
        {
          $group: {
            _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      // Combine all stats
      const allStats = {
        generalStats: stats[0] || { totalArticles: 0, totalComments: 0 },
        tagDistribution: tagStats,
        articleGrowth: articleGrowth,
      };

      // Format response based on requested format
      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", "attachment; filename=article-stats.json");
        return res.send(JSON.stringify(allStats, null, 2));
      } else if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=article-stats.csv");

        // Convert JSON to CSV format
        let csvContent = "Category,Metric,Value\n";

        // General stats
        csvContent += `General,Total Articles,${allStats.generalStats.totalArticles}\n`;
        csvContent += `General,Total Comments,${allStats.generalStats.totalComments}\n`;

        // Tag distribution
        allStats.tagDistribution.forEach((tag) => {
          csvContent += `Tag Distribution,${tag._id},${tag.count}\n`;
        });

        // Article growth
        allStats.articleGrowth.forEach((growth) => {
          const monthName = new Date(0, growth._id.month - 1).toLocaleString("default", {
            month: "long",
          });
          csvContent += `Article Growth,${monthName} ${growth._id.year},${growth.count}\n`;
        });

        return res.send(csvContent);
      } else {
        return res.status(400).json({ message: "Unsupported export format. Use csv or json." });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  async getCommentStats(req, res) {
    try {
      const commentStats = await Comment.aggregate([
        { $group: { _id: "$article", count: { $sum: 1 } } },

        { $match: { "article.author": req.user.id } },
      ]);
      res.json({ commentStats });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
};

module.exports = analyticsController;
