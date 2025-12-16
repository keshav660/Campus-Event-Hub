

import React, { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { postRequest } from "../utils/api"; 
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./OtpVerification.css";

export default function OtpVerification() {
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [message, setMessage] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || ""; // Email from ForgotPassword page

  // Countdown timer
  useEffect(() => {
    if (countdown === 0) {
      clearInterval(timerRef.current);
      setResendDisabled(false);
    }
  }, [countdown]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // --------------------------------------------------------
  // ✅ VERIFY OTP (Correct Backend Route)
  // --------------------------------------------------------
  const handleVerify = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      setMessage("Please enter the OTP.");
      return;
    }

    setIsVerifying(true);
    setMessage("");

    try {
      const res = await postRequest("/auth/verify-otp", { email, otp }); // ✔ FIXED BACKEND ROUTE
      setIsVerifying(false);

      toast.success(res.message || "OTP Verified Successfully !!", {
        autoClose: 1000,
        className: "custom-toast",
        progressClassName: "custom-toast-progress",
        icon: false,
      });

      // Redirect to Reset Password page
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 1200);
    } catch (err) {
      setIsVerifying(false);
      setMessage(err.message || "Invalid OTP. Try again.");
    }
  };

  // --------------------------------------------------------
  // ✅ RESEND OTP (Correct Backend Route)
  // --------------------------------------------------------
  const handleResend = async () => {
    if (resendDisabled) return;

    try {
      const res = await postRequest("/auth/send-otp", { email }); // ✔ FIXED BACKEND ROUTE

      setMessage("OTP resent. Check your email.");
      setResendDisabled(true);
      setCountdown(30);

      // Start timer
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      toast.success(res.message || "OTP resent successfully!", {
        autoClose: 1200,
        icon: false,
      });
    } catch (err) {
      setMessage(err.message || "Error resending OTP.");
    }
  };

  return (
    <>
      <Navbar type="register" />
      <div className="otp-container">
        <div className="otp-card">
          <h1 className="otp-title">OTP Verification</h1>
          <div className="otp-subtitle">Campus Event Hub</div>
          <p className="otp-instruction">
            Enter the code sent to your email ID :
          </p>

          <form className="otp-form" onSubmit={handleVerify}>
            <div className="otp-input-wrapper">
              <input
                type={showOtp ? "text" : "password"}
                placeholder="Please enter OTP here"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="otp-input"
              />
              <button
                type="button"
                className="otp-eye"
                onClick={() => setShowOtp(!showOtp)}
                aria-label={showOtp ? "Hide OTP" : "Show OTP"}
              >
                {showOtp ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>

            <button
              type="submit"
              className={`otp-verify-btn ${isVerifying ? "pop" : ""}`}
            >
              {isVerifying ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          {message && <div className="otp-message">{message}</div>}

          <div className="otp-resend-row">
            <button
              className="otp-resend-btn"
              onClick={handleResend}
              disabled={resendDisabled}
            >
              {resendDisabled ? `Resend in ${countdown}s` : "Resend Code"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
