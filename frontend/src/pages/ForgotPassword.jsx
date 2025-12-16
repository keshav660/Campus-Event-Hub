import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { postRequest } from "../utils/api"; 
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");       
  const [message, setMessage] = useState("");   
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage("Please enter your email.");
      return;
    }

    try {
      const res = await postRequest("/auth/send-otp", { email });

      toast.success(res.message || "OTP sent successfully!", {
        position: "top-center",
        autoClose: 1200,
        icon: false,
      });

      setMessage("");          
      setEmail("");            

      // Pass email to OTP page
      setTimeout(() => navigate("/otp", { state: { email } }), 1300);
    } catch (err) {
      setMessage(err.message || "Something went wrong. Try again.");
    }
  };

  const handleGoBack = () => navigate("/login");

  return (
    <>
      <Navbar type="register" />
      <div className="forgot-container">
        <div className="forgot-card">
          <h1 className="forgot-title">Forgot Password?</h1>
          <p className="forgot-subtitle">Campus Event Hub</p>

          <form onSubmit={handleSendOtp}>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setMessage(""); }}
              />
            </div>

            <button type="submit" className="send-btn">Send OTP</button>

            {message && <div className="forgot-message error-message">{message}</div>}
          </form>

          <button className="go-back" onClick={handleGoBack}>Go Back</button>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
