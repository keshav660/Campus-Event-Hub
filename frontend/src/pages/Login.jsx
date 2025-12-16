

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import { postRequest } from "../utils/api";
import "react-toastify/dist/ReactToastify.css";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage("Please enter your email & password");
      return;
    }

    try {
      // Backend API call
      const res = await postRequest("/auth/login", {
        email,
        password,
      });

      toast.success("Login successful!", {
        position: "top-center",
        autoClose: 1500,
      });

      // Save token
      localStorage.setItem("token", res.token);

      // ⭐ FIX: Always save the backend user object
      localStorage.setItem("user", JSON.stringify(res.user));

      // Save old keys also (if your other pages use them)
      if (res.user.role === "STUDENT") {
        localStorage.setItem("loggedInStudent", JSON.stringify(res.user));
      } else {
        localStorage.setItem("loggedInAdmin", JSON.stringify(res.user));
      }

      const role = res.user.role?.toUpperCase();

      // Redirect based on role
      setTimeout(() => {
        if (role === "STUDENT") navigate("/student/dashboard");
        else if (role === "ADMIN" || role === "ORGANIZER")
          navigate("/admin/dashboard");
        else navigate("/dashboard");
      }, 1500);
    } catch (err) {
      setMessage(err.message || "Login failed");
      toast.error(err.message || "Login failed", {
        position: "top-center",
        autoClose: 1500,
      });
    }
  };

  return (
    <>
      <Navbar type="register" />

      <div className="login-container">
        <div className="auth-box">
          <h2>Welcome!</h2>
          <p>Sign in to Campus Event Hub</p>

          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setMessage("");
              }}
            />

            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setMessage("");
                }}
              />
              <span
                className="password-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>

            <div className="auth-options">
              <label className="remember">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="btn full-width-btn">
              Login
            </button>

            {message && <div className="auth-message">{message}</div>}
          </form>

          <p>
            Don’t have an Account? <Link to="/signup">Register</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;

