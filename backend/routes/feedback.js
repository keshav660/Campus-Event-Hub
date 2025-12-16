const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const {
  createOrUpdateFeedback,
  getEventFeedback,
} = require("../controllers/feedbackController");

// All routes here require login
router.post("/:eventId", auth, createOrUpdateFeedback);
router.get("/:eventId", auth, getEventFeedback);

module.exports = router;
