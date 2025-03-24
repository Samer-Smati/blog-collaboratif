const User = require("../models/User");
const bcrypt = require("bcryptjs");

/**
 * Create an admin user with predefined credentials
 * This endpoint should be secured and only accessible by system administrators
 */
const createAdminUser = async (req, res) => {
  try {
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: "samersmati@gmail.com" });

    if (existingUser) {
      return res.status(400).json({
        message: "Admin user with this email already exists",
      });
    }

    // Create new admin user with predefined credentials
    const user = await User.create({
      username: "admin",
      email: "samersmati@gmail.com",
      password: "Azerty123", // Password will be hashed by the pre-save hook
      role: "admin",
    });

    // Return success message (don't return the user object for security)
    res.status(201).json({
      message: "Admin user created successfully",
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    res.status(500).json({ message: "Failed to create admin user" });
  }
};

module.exports = { createAdminUser };
