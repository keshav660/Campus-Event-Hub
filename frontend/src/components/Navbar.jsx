import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ type }) => {
  const [active, setActive] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Reset active link when navigating to non-landing pages
  useEffect(() => {
    if (location.pathname !== "/") {
      setActive("");
    }
  }, [location.pathname]);

  const handleScroll = (section) => {
    if (location.pathname !== "/") {
      // Navigate to LandingPage first, pass section to scroll
      navigate("/", { state: { scrollTo: section } });
    } else {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else if (section === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    setActive(section);
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <h2 className="logo" onClick={() => navigate("/")}>
          CampusEventHub
        </h2>
      </div>

      <div className="nav-right">
        <ul className="nav-links">
          {["home", "events", "about", "contact"].map((section) => (
            <li key={section}>
              <span
                className={active === section ? "active" : ""}
                onClick={() => handleScroll(section)}
                style={{ cursor: "pointer" }}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </span>
            </li>
          ))}
        </ul>

        {type === "register" ? (
          <Link to="/signup" className="nav-btn">
            Register
          </Link>
        ) : (
          <Link to="/login" className="nav-btn">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
