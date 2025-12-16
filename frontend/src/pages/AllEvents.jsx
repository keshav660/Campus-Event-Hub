// src/pages/AllEvents.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaUniversity,
  FaSearch,
  FaArrowLeft,
  FaTimes,
  FaHourglassHalf,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import StudentLayout from "../components/StudentLayout";
import "./StudentDashboard.css"; // use the same CSS as student dashboard so styles match exactly

// Import the Feedback modal (portal + scroll-lock)
import FeedbackModal from "../components/FeedbackModal";

const API_EVENTS = "http://localhost:5000/api/events";
const API_REG = "http://localhost:5000/api/registrations";

const AllEvents = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCollege, setFilterCollege] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    college: "",
    department: "",
    yearOfStudy: "",
  });

  // details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [justRegisteredEvent, setJustRegisteredEvent] = useState(null);

  const token = localStorage.getItem("token");

  // -------------------------------------------------------------
  // Load Events From Backend (fallback to localStorage)
  // -------------------------------------------------------------
  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch(API_EVENTS, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        try {
          localStorage.setItem("createdEvents", JSON.stringify(data.events || []));
        } catch {}
      } else {
        const fallback = JSON.parse(localStorage.getItem("createdEvents") || "[]");
        setEvents(Array.isArray(fallback) ? fallback : []);
      }
    } catch (err) {
      const fallback = JSON.parse(localStorage.getItem("createdEvents") || "[]");
      setEvents(Array.isArray(fallback) ? fallback : []);
    }
  }, [token]);

  // -------------------------------------------------------------
  // Load User Registrations From Backend (fallback to localStorage)
  // -------------------------------------------------------------
  const loadMyRegistrations = useCallback(async () => {
    try {
      const res = await fetch(`${API_REG}/my`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setUserRegistrations(data.registrations || []);
      } else {
        const regs = JSON.parse(localStorage.getItem("registeredEvents") || "[]");
        setUserRegistrations(Array.isArray(regs) ? regs : []);
      }
    } catch (err) {
      const regs = JSON.parse(localStorage.getItem("registeredEvents") || "[]");
      setUserRegistrations(Array.isArray(regs) ? regs : []);
    }
  }, [token]);

  useEffect(() => {
    loadEvents();
    loadMyRegistrations();

    // Auto-refresh when tab gains focus (so edits in other windows show up)
    const onFocus = () => {
      loadEvents();
      loadMyRegistrations();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadEvents, loadMyRegistrations]);

  // -------------------------------------------------------------
  // Registration Modal Functions
  // -------------------------------------------------------------
  const openRegistrationModal = (event) => {
    const student = JSON.parse(localStorage.getItem("loggedInStudent") || "{}");
    setSelectedEvent(event);
    setFormData({
      fullName: student.name || "",
      email: student.email || "",
      college: student.college || "",
      department: student.department || "",
      yearOfStudy: student.yearOfStudy || student.year || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setFormData({
      fullName: "",
      email: "",
      college: "",
      department: "",
      yearOfStudy: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // details modal handlers
  const openDetailsModal = (event) => {
    if (!event) return;
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedEvent(null);
  };

  // -------------------------------------------------------------
  // Submit Registration — Backend Only
  // -------------------------------------------------------------
  const handleSubmitRegistration = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.college || !formData.department || !formData.yearOfStudy) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const res = await fetch(`${API_EVENTS}/${selectedEvent._id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ registrationDetails: formData }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Registration submitted!");

        // Close registration modal
        closeModal();

        // Refresh registrations and events
        await loadMyRegistrations();
        await loadEvents();

        // Open feedback modal for just-registered event
        setJustRegisteredEvent(selectedEvent);
        setShowFeedbackModal(true);
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (err) {
      toast.error("Server error during registration");
    }
  };

  // -------------------------------------------------------------
  // Get Status for Event
  // -------------------------------------------------------------
  const getStatusForEvent = (eventId) => {
    const reg = userRegistrations.find((r) => {
      const rid = r?.event?._id || r?.event?.id || r?._id || r?.id;
      return rid === eventId;
    });
    return reg ? reg.status : null;
  };

  // -------------------------------------------------------------
  // UPDATED: Show correct button based on event datetime & registration status
  // - Use timestamps for precise comparison
  // - Auto-refresh on tab focus so admin edits show up immediately
  // -------------------------------------------------------------
  const getRegistrationButton = (event) => {
    const id = event._id || event.id;
    const status = getStatusForEvent(id);

    // Compute event timestamp robustly
    const eventTime = (() => {
      try {
        // Some events store date as ISO string, some may store only date — Date handles both
        const ts = new Date(event.date).getTime();
        return Number.isFinite(ts) ? ts : null;
      } catch {
        return null;
      }
    })();

    const now = Date.now();

    const isPastEvent = eventTime ? eventTime < now : false;

    // EVENT COMPLETED — SHOW "Completed"
    if (isPastEvent) {
      return (
        <button className="status-btn rejected-btn" disabled>
          <FaTimesCircle /> Completed
        </button>
      );
    }

    // USER NOT REGISTERED YET → Show "Register"
    if (!status) {
      return (
        <button className="register-btn" onClick={() => openRegistrationModal(event)}>
          Register
        </button>
      );
    }

    // USER REGISTERED → Show status badge
    if (status === "pending")
      return (
        <button className="status-btn pending-btn" disabled>
          <FaHourglassHalf /> Pending
        </button>
      );

    if (status === "approved")
      return (
        <button className="status-btn approved-btn" disabled>
          <FaCheckCircle /> Approved
        </button>
      );

    if (status === "rejected")
      return (
        <button className="status-btn rejected-btn" disabled>
          <FaTimesCircle /> Rejected
        </button>
      );

    return null;
  };

  // -------------------------------------------------------------
  // Filtering & render helpers
  // -------------------------------------------------------------
  const getEventDate = (ev) => ev.date?.split("T")[0] || "";

  const filteredEvents = events.filter((ev) => {
    const title = ev.name?.toLowerCase() || "";
    const matchesSearch = title.includes(search.toLowerCase());
    const matchesCategory = filterCategory ? ev.category === filterCategory : true;
    const matchesCollege = filterCollege ? ev.college === filterCollege : true;
    const dateKey = getEventDate(ev);
    const matchesDate = filterDate ? dateKey === filterDate : true;
    return matchesSearch && matchesCategory && matchesCollege && matchesDate;
  });

  const uniqueColleges = [...new Set(events.map((e) => e.college).filter(Boolean))];
  const uniqueCategories = [...new Set(events.map((e) => e.category).filter(Boolean))];

  return (
    <StudentLayout>
      <ToastContainer position="top-center" autoClose={2000} />

      <div className="all-events-page">
        {/* Search & Filters */}
        <div className="filter-bar">
          <div className="student-search">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filters filters-grid">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {uniqueCategories.map((cat, i) => (
                <option key={i} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select value={filterCollege} onChange={(e) => setFilterCollege(e.target.value)}>
              <option value="">All Colleges</option>
              {uniqueColleges.map((clg, i) => (
                <option key={i} value={clg}>
                  {clg}
                </option>
              ))}
            </select>

            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />

            <button
              className="filter-clear"
              onClick={() => {
                setSearch("");
                setFilterCategory("");
                setFilterCollege("");
                setFilterDate("");
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Events Grid */}
        <div className="events-grid three-grid">
          {filteredEvents.map((ev, index) => (
            <div key={ev._id || ev.id || index} className="event-card">
              <div className="event-img-wrapper">
                {ev.poster ? (
                  <img loading="lazy" src={ev.poster} alt={ev.name} className="event-img" />
                ) : (
                  <div className="event-img-placeholder">No Image</div>
                )}
              </div>

              <div className="event-info">
                <div>
                  {/* Title row with Eye Icon */}
                  <div className="event-title-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <h3 style={{ margin: 0 }}>{ev.name}</h3>

                    {/* Eye Icon: open details modal (inline SVG used instead of FaEye) */}
                    <button
                      aria-label={`View details for ${ev.name}`}
                      title="View more details"
                      onClick={() => openDetailsModal(ev)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        focusable="false"
                        style={{ color: "#0b1226" }}
                      >
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                  </div>

                  <p className="event-short-desc">{ev.description}</p>
                </div>

                <div>
                  <div className="event-details">
                    <span>
                      <FaClock /> {ev.time}
                    </span>
                    <span>
                      <FaCalendarAlt /> {getEventDate(ev)}
                    </span>
                  </div>

                  {ev.college && (
                    <p className="college-info">
                      <FaUniversity /> {ev.college}
                    </p>
                  )}

                  {getRegistrationButton(ev)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <button className="floating-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
      </div>

      {/* ---------- Details Modal (NEW) ---------- */}
      {showDetailsModal && selectedEvent && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedEvent.name}</h2>
            </div>

            <div className="modal-body">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 600 }}>Location</td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}>{selectedEvent.location || "N/A"}</td>
                  </tr>

                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 600 }}>Prizes</td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}>{selectedEvent.prizes || "N/A"}</td>
                  </tr>

                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 600 }}>Eligibility</td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}>{selectedEvent.eligibility || "N/A"}</td>
                  </tr>

                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 600 }}>Entry Fee</td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}>{selectedEvent.entryFee ?? selectedEvent.entry_fee ?? "Free"}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                <button className="cancel-btn" onClick={closeDetailsModal} style={{ width: 220 }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Register for Event</h2>
              <button className="modal-close" onClick={closeModal} type="button">
                <FaTimes />
              </button>
            </div>

            {/* registration form */}
            <form className="modal-body" onSubmit={handleSubmitRegistration} noValidate>
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>College Name *</label>
                <input type="text" name="college" value={formData.college} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Department / Branch *</label>
                <input type="text" name="department" value={formData.department} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Year of Study *</label>
                <select name="yearOfStudy" value={formData.yearOfStudy} onChange={handleInputChange} required>
                  <option value="">Select year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="submit-btn">
                  Submit Registration
                </button>
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal - appears after successful registration */}
      {showFeedbackModal && justRegisteredEvent && (
        <FeedbackModal event={justRegisteredEvent} onClose={() => setShowFeedbackModal(false)} />
      )}
    </StudentLayout>
  );
};

export default AllEvents;
