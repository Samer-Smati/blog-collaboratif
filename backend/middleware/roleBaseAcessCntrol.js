const User = require("../microservices/user-service/models/User");
const jwt = require("jsonwebtoken");

/**
 * Role-Based Access Control (RBAC) middleware
 * Provides fine-grained access control based on user roles
 */

// Permission levels for different roles
const rolePermissions = {
  admin: ["read", "write", "update", "delete", "manage_users", "manage_roles", "view_stats"],
  editor: ["read", "write", "update", "view_stats"],
  writer: ["read", "write"],
  reader: ["read"],
}; 

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No authentication token, access denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database to ensure we have the latest role information
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Attach user and role to request
    req.user = {
      id: user._id,
      role: user.role, // Make sure role is included
    };

    // Add user's permissions to the request for potential use in controllers
    req.userPermissions = rolePermissions[user.role] || [];
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid authentication token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Authentication token expired" });
    }
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Check if a user has the required permission
 * @param {string} userRole - The role of the user
 * @param {string} requiredPermission - The permission to check
 * @returns {boolean} - Whether the user has the permission
 */
const hasPermission = (userRole, requiredPermission) => {
  // Admin has all permissions
  if (userRole === "admin") return true;

  // Check if the user's role has the required permission
  return rolePermissions[userRole]?.includes(requiredPermission) || false;
};

/**
 * Middleware to check if user has required permission
 * @param {string} permission - The permission required for the route
 * @returns {function} - Express middleware function
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // If no user is attached to the request, deny access
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get user from database to ensure we have the latest role information
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has the required permission
      if (hasPermission(user.role, permission)) {
        // Add user's permissions to the request for potential use in controllers
        req.userPermissions = rolePermissions[user.role] || [];
        return next();
      }

      return res.status(403).json({ message: "Insufficient permissions" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
};

/**
 * Middleware to ensure user is an admin
 */
const requireAdmin = async (req, res, next) => {
  try {
    // If no user is attached to the request, deny access
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Get user from database to ensure we have the latest role information
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is an admin
    if (user.role === "admin") {
      return next();
    }

    return res.status(403).json({ message: "Admin access required" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { requirePermission, requireAdmin, hasPermission, rolePermissions, auth };
