
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { sendMail } = require("../utils/mailer");

// memory OTP store
let otpStore = {};

// Generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// Small helper to get dashboard URL based on role
function getDashboardUrl(role) {
  const frontendBase =
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000";

  const r = (role || "").toUpperCase();

  let path = "/student/dashboard"; // default

  if (r === "ADMIN") path = "/admin/dashboard";
  else if (r === "ORGANIZER") path = "/organizer/dashboard";

  return `${frontendBase}${path}`;
}

// -------------------- SIGNUP --------------------
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    user = new User({ name, email, password, role });
    await user.save();

    const token = generateToken(user);

    // Send Welcome Email (THANK YOU + DASHBOARD BUTTON)
    try {
      const dashboardUrl = getDashboardUrl(user.role);

      await sendMail({ // implenented in utils/mailer.js for sending emails
        to: user.email,
        subject: "Welcome to Campus Event Hub 🎉", // icon wsa taken buy icon .com
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
              <h2 style="color: #222; margin-bottom: 8px;">Hi ${user.name},</h2>
              <p style="font-size: 15px; color: #444; line-height: 1.6;">
                Thank you for signing up to <strong>Campus Event Hub</strong>! 🎓🎉<br/>
                Your account has been created successfully as a <strong>${user.role}</strong>.
              </p>

              <p style="font-size: 14px; color: #555; margin-top: 18px; margin-bottom: 6px;">
                You can access your dashboard using the button below:
              </p>

              <div style="text-align: center; margin: 20px 0;">
                <a href="${dashboardUrl}"
                   style="display: inline-block; padding: 12px 22px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 999px; font-size: 15px; font-weight: bold;">
                  Go to Dashboard
                </a>
              </div>

              <p style="font-size: 13px; color: #777; line-height: 1.5;">
                If the button doesn’t work, you can copy and paste this link into your browser:<br/>
                <span style="color: #2563eb; word-break: break-all;">${dashboardUrl}</span>
              </p>

              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

              <p style="font-size: 12px; color: #999; text-align: center;">
                Campus Event Hub • Manage & explore campus events effortlessly 
              </p>
            </div>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("Welcome email error:", mailErr);
      // Don't break signup if email fails
    }

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
};

// -------------------- LOGIN --------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

// -------------------- SEND OTP --------------------
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email))
      return res.status(400).json({ message: "Valid email required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp;

    // Send email
    await sendMail({
      to: email,
      subject: "Your OTP Code",
      html: `<h2>Your OTP Code is:</h2>
             <h1>${otp}</h1>
             <p>Valid for 10 minutes.</p>`,
    });

    res.json({ message: "OTP sent successfully!" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ message: "Server error sending OTP" });
  }
};

// -------------------- VERIFY OTP --------------------
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email])
    return res.status(400).json({ message: "OTP expired or not requested" });

  if (otpStore[email] != otp)
    return res.status(400).json({ message: "Invalid OTP" });

  delete otpStore[email];

  res.json({ message: "OTP verified successfully" });
};

// -------------------- RESET PASSWORD --------------------
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email & new password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password and save this is used when resetting password 
    //const hashed = await bcrypt.hash(newPassword, 10);
    //user.password = hashed;

    user.password = newPassword;

    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Server error during password reset" });
  }
};
