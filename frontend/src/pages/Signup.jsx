
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import { postRequest } from "../utils/api";
import "react-toastify/dist/ReactToastify.css";
import "./Auth.css";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { email, name, password, confirmPassword, role } = formData;

    if (!email || !name || !password || !confirmPassword || !role) {
      setMessage("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      // ✅ Correct backend API
      const res = await postRequest("/auth/signup", {
        name,
        email,
        password,
        role: role.toUpperCase(),
      });

//       const res = await postRequest("/auth/signup", {
//   name: username,       // backend expects "name"
//   email,
//   password,
//   role: role.toLowerCase(),
// });

      toast.success("Account created successfully!", {
        position: "top-center",
        autoClose: 2000,
      });

      // Reset form
      setFormData({
        email: "",
        name: "",
        password: "",
        confirmPassword: "",
        role: "",
      });

      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setMessage(err.message || "Signup failed!");
      toast.error(err.message || "Signup failed!", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  return (
    <>
      <Navbar type="login" />

      <div className="signup-container">
        <div className="auth-box">
          <h2>Welcome!</h2>
          <p>Sign up to Campus Event Hub</p>

          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />

            <label>Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
            />

            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
              <span
                className="password-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>

            <label>Confirm Password</label>
            <div className="password-wrapper">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <span
                className="password-icon"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>

            <label>Your Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="">Select Role</option>
              <option value="student">Student</option>
              <option value="organizer">Organizer</option>
            </select>

            <button type="submit" className="btn full-width-btn">
              Register
            </button>

            {message && <p className="auth-message">{message}</p>}
          </form>

          <p>
            Already have an Account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Signup;
