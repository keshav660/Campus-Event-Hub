

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const { getAdminStats } = require("../controllers/statsController");

router.get("/", auth, role("admin"), getAdminStats);

module.exports = router;

