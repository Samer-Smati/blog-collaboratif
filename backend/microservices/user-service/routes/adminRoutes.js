const express = require("express");
const router = express.Router();
const { createAdminUser } = require("../controllers/adminController");
const { requirePermission, auth } = require("../../../middleware/roleBaseAcessCntrol");

// Admin user creation route - secured with authentication and admin permission
// This route should only be accessible by system administrators
router.post("/create-admin", auth, requirePermission("manage_users"), createAdminUser);

module.exports = router;
