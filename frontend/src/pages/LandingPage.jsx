import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, CheckCircle, Bell, Mail, Phone, Clock } from "lucide-react";
import Navbar from "../components/Navbar";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo) {
      const section = location.state.scrollTo;
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.state]);

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <Navbar />

      {/* HERO SECTION */}
      <section className="hero" id="home">
        <div className="hero-content">
          <h1>Discover & Join <br /> Campus Events Effortlessly</h1>
          <p>Browse, register, and manage events in one simple platform.</p>
          <button className="btn" onClick={handleLoginRedirect}>
            Get Started
          </button>
        </div>
        <div className="hero-image"></div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="events" id="events">
        <h2>Upcoming Events</h2>
        <div className="event-cards">
          <div className="card">
            <h3>Tech Innovators Meetup</h3>
            <p><strong>Date:</strong> Nov 10, 2025</p>
            <p><strong>Venue:</strong> Engineering Hall, Room 301</p>
            <button onClick={handleLoginRedirect}>Register</button>
          </div>
          <div className="card">
            <h3>Art & Design Showcase</h3>
            <p><strong>Date:</strong> Nov 12, 2025</p>
            <p><strong>Venue:</strong> Fine Arts Gallery</p>
            <button onClick={handleLoginRedirect}>Register</button>
          </div>
          <div className="card">
            <h3>Startup Pitch Night</h3>
            <p><strong>Date:</strong> Nov 15, 2025</p>
            <p><strong>Venue:</strong> Business Auditorium</p>
            <button onClick={handleLoginRedirect}>Register</button>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="why-choose" id="about">
        <h2>Why Choose Us?</h2>
        <div className="features">
          <div className="feature">
            <Search className="icon" />
            <h4>Easy Discovery</h4>
            <p>
              Find relevant campus events quickly with our powerful search and filtering tools.
            </p>
          </div>
          <div className="feature">
            <CheckCircle className="icon" />
            <h4>Seamless Registration</h4>
            <p>
              Register for any event in just a few clicks and manage all your bookings in one place.
            </p>
          </div>
          <div className="feature">
            <Bell className="icon" />
            <h4>Stay Updated</h4>
            <p>
              Get timely reminders and updates about the events you’ve registered for.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER INFO BOXES */}
      <section className="footer-info" id="contact">
        <div className="footer-box">
          <h3>About Campus Event Hub</h3>
          <p>
            Campus Event Hub is your one-stop platform to explore, manage, and register
            for university events seamlessly. Stay engaged and make the most of your campus life.
          </p>
        </div>

        <div className="footer-box">
          <h3>Quick Links</h3>
          <ul>
            <li onClick={() => scrollToSection("home")}>Home</li>
            <li onClick={() => scrollToSection("about")}>Dashboard</li>
            <li onClick={() => scrollToSection("events")}>Event Management</li>
            <li onClick={() => scrollToSection("contact")}>Feedback</li>
          </ul>
        </div>

        <div className="footer-box">
          <h3>Support</h3>
          <p>
            <Mail size={16} style={{ marginRight: "6px", verticalAlign: "middle" }} />
            infosysteam4@campusconnect.edu
          </p>
          <p>
            <Phone size={16} style={{ marginRight: "6px", verticalAlign: "middle" }} />
            +91 9876543210
          </p>
          <p>
            <Clock size={16} style={{ marginRight: "6px", verticalAlign: "middle" }} />
            Mon–Fri, 9:00 AM – 6:00 PM
          </p>
        </div>
      </section>

      {/* COPYRIGHT FOOTER */}
      <footer>
        <p>© 2025 Campus Event Hub. All rights reserved.</p>
      </footer>
    </>
  );
};

export default LandingPage;
