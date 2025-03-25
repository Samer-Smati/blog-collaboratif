const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Article = require("../../article-service/models/Article");
const Comment = require("../../comment-service/models/Comment");

const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ username, email, password });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    console.log("user", user);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token with user ID and role
    const accessToken = jwt.sign(
      {
        id: user._id,
        role: user.role, // Include the role in the token
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Set cookies with proper options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    };

    // Set access token cookie
    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 3600000, // 1 hour
    });

    // Set refresh token cookie
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send response without sensitive data
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.status(200).json({
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: "Refresh token failed" });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const updates = {};

    if (username) updates.username = username;
    if (email) updates.email = email;

    // Check if username or email already exists
    if (username || email) {
      const existingUser = await User.findOne({
        _id: { $ne: req.user.id },
        $or: [...(username ? [{ username }] : []), ...(email ? [{ email }] : [])],
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Username or email already in use",
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", role = "" } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role && ["admin", "editor", "writer", "reader"].includes(role)) {
      query.role = role;
    }

    // Count total users matching query
    const totalUsers = await User.countDocuments(query);

    // Get paginated users
    const users = await User.find(query)
      .select("-password -refreshToken")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      items: users,
      totalItems: totalUsers,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const articles = await Article.find({ author: userId });
    const comments = await Comment.find({ userId: userId });
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user, articles, comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!["admin", "editor", "writer", "reader"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Only admins can update roles
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findByIdAndUpdate(userId, { $set: { role } }, { new: true }).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserStats = async (req, res) => {
  try {
    // Check if req.user exists
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Only admins and editors can view stats
    if (req.user && req.user.role && !["admin", "editor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Count users by role
    const stats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    // Safer approach to getting article counts by role - handle potential ObjectId issues
    const articlesByRole = await Article.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorInfo",
        },
      },
      // Only include documents where the authorInfo was successfully joined
      { $match: { "authorInfo.0": { $exists: true } } },
      { $unwind: "$authorInfo" },
      {
        $group: {
          _id: "$authorInfo.role",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent user registrations
    const recentRegistrations = await User.find()
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .limit(5);

    // Format the response
    const roleStats = {};
    stats.forEach((stat) => {
      if (stat._id) {
        // Ensure _id exists
        roleStats[stat._id] = {
          users: stat.count,
          articles: 0,
        };
      }
    });

    articlesByRole.forEach((stat) => {
      if (stat._id && roleStats[stat._id]) {
        roleStats[stat._id].articles = stat.count;
      }
    });

    res.json({
      roles: roleStats,
      recentRegistrations,
      totalUsers: stats.reduce((sum, stat) => sum + stat.count, 0),
      usersByRole: stats,
      articlesByRole,
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({ message: error.message });
  }
};

// Safe version of user stats that avoids ObjectId casting errors
const getSafeUserStats = async (req, res) => {
  try {
    // Check permissions - same as getUserStats
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user && req.user.role && !["admin", "editor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Direct database queries to avoid aggregation pipeline issues
    const totalUsers = await User.countDocuments({});

    // Count by role using simple queries instead of aggregation
    const adminCount = await User.countDocuments({ role: "admin" });
    const editorCount = await User.countDocuments({ role: "editor" });
    const writerCount = await User.countDocuments({ role: "writer" });
    const readerCount = await User.countDocuments({ role: "reader" });

    // Format response
    const roleStats = {
      admin: { users: adminCount, articles: 0 },
      editor: { users: editorCount, articles: 0 },
      writer: { users: writerCount, articles: 0 },
      reader: { users: readerCount, articles: 0 },
    };

    const usersByRole = [
      { _id: "admin", count: adminCount },
      { _id: "editor", count: editorCount },
      { _id: "writer", count: writerCount },
      { _id: "reader", count: readerCount },
    ];

    // Get recent registrations
    const recentRegistrations = await User.find()
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      roles: roleStats,
      recentRegistrations,
      totalUsers,
      usersByRole,
    });
  } catch (error) {
    console.error("Error getting safe user stats:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  getAllUsers,
  updateUserRole,
  getUserStats,
  getUserById,
  getSafeUserStats,
};
