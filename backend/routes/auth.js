


// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

console.log("  Auth routes loaded successfully");

// Public routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// OTP routes
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);

// Reset password (ONLY this one exists )
router.post("/reset-password", authController.resetPassword);

// Protected
router.get("/me", auth, async (req, res) => {
  res.json({ user: req.user });
});

// Debug
router.post("/debug", (req, res) => {
  res.json({ message: "Routes working" });
});

module.exports = router;
