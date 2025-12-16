

// routes/event.js
const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

// PUBLIC ROUTES
router.get("/", eventController.listEvents);       
router.get("/:id", eventController.getEvent);

// ADMIN ROUTES
router.post("/", auth, role("admin"), eventController.createEvent);
router.put("/:id", auth, role("admin"), eventController.updateEvent);
router.delete("/:id", auth, role("admin"), eventController.deleteEvent);

// STUDENT ROUTES
router.post("/:id/register", auth, role("student"), eventController.registerForEvent);
router.delete("/:id/register", auth, role("student"), eventController.cancelRegistration);

module.exports = router;
