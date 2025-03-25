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
  getUserById,
  getSafeUserStats,
} = require("../controllers/userController");
const { logout } = require("../controllers/authController");

const { requirePermission, auth } = require("../../../middleware/roleBaseAcessCntrol");
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

// Stats routes - must come BEFORE the dynamic :userId route to avoid conflict
router.get("/user-stats", auth, requirePermission(["admin", "editor"]), getUserStats);
router.get("/safe-stats", auth, requirePermission(["admin", "editor"]), getSafeUserStats);

// User management routes with RBAC
router.get("/", auth, requirePermission(["admin"]), getAllUsers);
router.get("/:userId", auth, getUserById);
router.patch("/:userId/role", auth, requirePermission(["admin"]), updateUserRole);

module.exports = router;
