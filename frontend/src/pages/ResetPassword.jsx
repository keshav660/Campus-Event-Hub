

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { postRequest } from "../utils/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ResetPassword.css";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");

  // 🚨 If user opens reset page manually => redirect back
  if (!email) {
    return (
      <div style={{ textAlign: "center", paddingTop: "100px" }}>
        <h2>Email not found — restart the process.</h2>
        <button 
          onClick={() => navigate("/forgot-password")} 
          className="reset-btn"
          style={{ marginTop: "20px" }}
        >
          Go to Forgot Password
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password.trim() || !confirmPassword.trim()) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      return;
    }

    try {
      // ✅ FIXED API route & correct field name
      const res = await postRequest("/auth/reset-password", {
        email,
        newPassword: password,
      });

      toast.success(res.message || "Password reset successfully!", {
        autoClose: 1200,
        icon: false,
      });

      setMessage("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => navigate("/login"), 1300);
    } catch (err) {
      setMessage(err.message || "Failed to reset password. Try again.");
    }
  };

  return (
    <>
      <Navbar type="login" />
      <div className="reset-container">
        <div className="reset-card">
          <h2 className="reset-title">Reset Password</h2>
          <p className="reset-subtitle">Campus Event Hub</p>

          <form className="reset-form" onSubmit={handleSubmit}>
            <div className="reset-input-wrapper">
              <label>New Password</label>
              <div className="input-with-icon">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>
            </div>

            <div className="reset-input-wrapper">
              <label>Confirm Password</label>
              <div className="input-with-icon">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>
            </div>

            <button type="submit" className="reset-btn">Save Password</button>
          </form>

          {message && <div className="reset-message">{message}</div>}
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
