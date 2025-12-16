// backend/routes/registrations.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const role = require("../middleware/role");
const Registration = require("../models/Registration");

// Controllers
const {
  getAllRegistrations,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
} = require("../controllers/registrationController");

/* ---------------------------------------------------------
   GET LOGGED-IN USER REGISTRATIONS
---------------------------------------------------------- */
router.get("/my", auth, async (req, res) => {
  try {
    const registrations = await Registration.find({ user: req.user._id })
      .populate("user", "name email college department yearOfStudy") // return full student info
      .populate("event", "name date poster college"); // event info for displaying cards

    return res.json({ registrations });
  } catch (err) {
    console.error("My registrations error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ---------------------------------------------------------
   ADMIN ROUTES
---------------------------------------------------------- */

// GET ALL REGISTRATIONS (admin only)
router.get("/", auth, role("admin"), getAllRegistrations);

// APPROVE REGISTRATION
router.put("/:id/approve", auth, role("admin"), approveRegistration);

// REJECT REGISTRATION
router.put("/:id/reject", auth, role("admin"), rejectRegistration);

/* ---------------------------------------------------------
   DELETE REGISTRATION
   - Admins can delete any registration
   - Users can delete their own registration
   - Event creators can delete registrations for their events
---------------------------------------------------------- */
router.delete("/:id", auth, deleteRegistration);

module.exports = router;
