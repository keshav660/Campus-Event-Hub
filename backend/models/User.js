// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },

  email: { 
    type: String, 
    required: true, 
    unique: true 
  },

  password: { 
    type: String 
  }, // password can be empty before reset

  role: {
    type: String,
    enum: ["ADMIN", "STUDENT", "ORGANIZER"],
    default: "STUDENT",
  },

  isVerified: { 
    type: Boolean, 
    default: false 
  },

  otp: { type: String },
  otpExpires: { type: Date },

  // ⭐⭐⭐ ADDED FIELDS (NOW STUDENT PROFILE HAS FULL DETAILS)
  college: {
    type: String,
    default: "",
  },

  department: {
    type: String,
    default: "",
  },

  yearOfStudy: {
    type: String,
    default: "",
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

// ⭐ Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ⭐ Compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
