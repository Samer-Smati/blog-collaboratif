const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  getAllUsers,
  updateUserRole,
  getUserStats,
} = require("../controllers/userController");
const { logout } = require("../controllers/authController");
const { auth, authorize } = require("../../../middleware/auth");
const { authLimiter } = require("../../../middleware/rateLimiter");
const validate = require("../../../middleware/validate");
const userSchemas = require("../../../validator/userValidator");

// Auth routes
router.post("/register", authLimiter, validate(userSchemas.register), register);
router.post("/login", authLimiter, validate(userSchemas.login), login);
router.post("/refresh-token", refreshToken);
router.post("/logout", auth, logout);

// Profile routes
router.get("/profile", auth, getProfile);
router.patch("/profile", auth, validate(userSchemas.updateProfile), updateProfile);

// User management routes (admin only)
router.get("/", auth, authorize("admin"), getAllUsers);
router.patch("/:userId/role", auth, authorize("admin"), updateUserRole);
router.get("/stats", auth, authorize("admin", "editor"), getUserStats);

module.exports = router;
