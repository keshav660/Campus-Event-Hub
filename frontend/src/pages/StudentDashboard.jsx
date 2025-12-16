// src/pages/StudentDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaSearch,
  FaUniversity,
  FaTimes,
  FaHourglassHalf,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./StudentDashboard.css";
import StudentLayout from "../components/StudentLayout";

// Constants
const API_EVENTS = "http://localhost:5000/api/events";
const API_REG = "http://localhost:5000/api/registrations";

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [userRegistrations, setUserRegistrations] = useState([]);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCollege, setFilterCollege] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // NEW — VIEW MORE DETAILS MODAL
  const [showDetails, setShowDetails] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    college: "",
    department: "",
    yearOfStudy: "",
  });

  const token = localStorage.getItem("token");

  // -------------------------------------------------------------
  // Load APPROVED Events Only (Backend)
  // -------------------------------------------------------------
  const loadApprovedEvents = useCallback(async () => {
    try {
      const res = await fetch(`${API_EVENTS}?status=approved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setEvents(data.events || []);
      } else {
        toast.error(data.message || "Failed to load events");
      }
    } catch (err) {
      toast.error("Server error while loading events");
    }
  }, [token]);

  // -------------------------------------------------------------
  // Load Student Registrations (Backend)
  // -------------------------------------------------------------
  const loadMyRegistrations = useCallback(async () => {
    try {
      const res = await fetch(`${API_REG}/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setUserRegistrations(data.registrations || []);
      } else {
        toast.error(data.message || "Failed to load registrations");
      }
    } catch (err) {
      toast.error("Server error loading registrations");
    }
  }, [token]);

  // INITIAL LOAD
  useEffect(() => {
    if (token) {
      loadApprovedEvents();
      loadMyRegistrations();
    }
  }, [token, loadApprovedEvents, loadMyRegistrations]);

  // Helpers
  const getEventDate = (ev) => ev.date?.split("T")[0] || "";

  const getStatusForEvent = useCallback(
    (eventId) => {
      const reg = userRegistrations.find((r) => r.event?._id === eventId);
      return reg ? reg.status : null;
    },
    [userRegistrations]
  );

  // -------------------------------------------------------------
  // Registration Modal Handlers
  // -------------------------------------------------------------
  const openRegistrationModal = useCallback((ev) => {
    const student = JSON.parse(localStorage.getItem("loggedInStudent") || "{}");

    setSelectedEvent(ev);
    setFormData({
      fullName: student.name || "",
      email: student.email || "",
      college: student.college || "",
      department: student.department || "",
      yearOfStudy: student.yearOfStudy || student.year || "",
    });

    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedEvent(null);
    setFormData({
      fullName: "",
      email: "",
      college: "",
      department: "",
      yearOfStudy: "",
    });
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Submit Registration
  const handleSubmitRegistration = useCallback(
    async (e) => {
      e.preventDefault();

      // Validate required fields
      if (
        !formData.fullName ||
        !formData.email ||
        !formData.college ||
        !formData.department ||
        !formData.yearOfStudy
      ) {
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
          // Refresh registrations
          await loadMyRegistrations();
          closeModal();
        } else {
          toast.error(data.message || "Registration failed");
        }
      } catch (err) {
        toast.error("Server error during registration");
      }
    },
    [formData, selectedEvent, token, loadMyRegistrations, closeModal]
  );

  // -------------------------------------------------------------
  // NEW — View More Details Modal
  // -------------------------------------------------------------
  const openDetails = (ev) => {
    setDetailsEvent(ev);
    setShowDetails(true);
  };

  // Registration Button UI
  const getRegistrationButton = useCallback(
    (ev) => {
      const status = getStatusForEvent(ev._id);

      if (!status)
        return (
          <button className="register-btn" onClick={() => openRegistrationModal(ev)}>
            Register
          </button>
        );

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
    },
    [getStatusForEvent, openRegistrationModal]
  );

  // FILTERING
  const todayISO = useMemo(() => new Date().toISOString().split("T")[0], []);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchSearch = ev.name.toLowerCase().includes(search.toLowerCase());
      const matchCollege = filterCollege ? ev.college === filterCollege : true;
      const matchCategory = filterCategory ? ev.category === filterCategory : true;

      const dateKey = getEventDate(ev);
      const matchUpcoming = dateKey >= todayISO;
      const matchDate = filterDate ? dateKey === filterDate : true;

      return matchSearch && matchCollege && matchCategory && matchDate && matchUpcoming;
    });
  }, [events, search, filterCollege, filterCategory, filterDate, todayISO]);

  const upcomingThree = useMemo(() => filteredEvents.slice(0, 3), [filteredEvents]);

  const uniqueColleges = useMemo(
    () => [...new Set(events.map((e) => e.college).filter(Boolean))],
    [events]
  );

  const uniqueCategories = useMemo(
    () => [...new Set(events.map((e) => e.category).filter(Boolean))],
    [events]
  );

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------
  return (
    <StudentLayout>
      <ToastContainer position="top-center" autoClose={2000} />

      <div className="dashboard-content">
        {/* SEARCH + FILTERS */}
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
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select value={filterCollege} onChange={(e) => setFilterCollege(e.target.value)}>
              <option value="">All Colleges</option>
              {uniqueColleges.map((clg) => (
                <option key={clg} value={clg}>
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

        {/* UPCOMING EVENTS */}
        <div className="section-header">
          <h2 className="section-title">Upcoming Approved Events</h2>
          <span className="event-count">
            Showing {upcomingThree.length} of {filteredEvents.length}
          </span>
        </div>

        <div className="events-grid three-grid">
          {upcomingThree.length > 0 ? (
            upcomingThree.map((ev) => (
              <div key={ev._id} className="event-card">
                <div className="event-img-wrapper">
                  {ev.poster ? (
                    <img src={ev.poster} alt={ev.name} className="event-img" loading="lazy" />
                  ) : (
                    <div className="event-img-placeholder">No Image</div>
                  )}
                </div>

                <div className="event-info">
                  {/* UPDATED TITLE + EYE ICON */}
                  <div className="event-title-row">
                    <h3>{ev.name}</h3>

                    <button
                      className="eye-btn"
                      title="View more details"
                      onClick={() => openDetails(ev)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>

                  <p className="event-short-desc">{ev.description}</p>

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
            ))
          ) : (
            <p className="no-events">No approved events found matching your filters.</p>
          )}
        </div>

        <div className="view-all-wrap">
          <button className="view-all-btn" onClick={() => navigate("/student/all/events")}>
            View All Events &gt;
          </button>
        </div>

        {/* Registration Modal */}
        {showModal && selectedEvent && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Register for {selectedEvent.name}</h2>
                <button className="modal-close" onClick={closeModal} type="button">
                  <FaTimes />
                </button>
              </div>

              <form className="modal-body" onSubmit={handleSubmitRegistration}>
                {/* FULL FORM UPDATED */}
                <div className="form-group">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="college">College Name *</label>
                  <input
                    id="college"
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="department">Department / Branch *</label>
                  <input
                    id="department"
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="yearOfStudy">Year of Study *</label>
                  <select
                    id="yearOfStudy"
                    name="yearOfStudy"
                    value={formData.yearOfStudy}
                    onChange={handleInputChange}
                    required
                  >
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

        {/* NEW — VIEW DETAILS MODAL */}
        {showDetails && detailsEvent && (
          <div className="details-modal-overlay" onClick={() => setShowDetails(false)}>
            <div className="details-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{detailsEvent.name}</h2>

              <div className="details-row">
                <span className="details-label">Location</span>
                <span className="details-value">
                  {detailsEvent.location || "Not provided"}
                </span>
              </div>

              <div className="details-row">
                <span className="details-label">Prizes</span>
                <span className="details-value">
                  {detailsEvent.prizes || "Not provided"}
                </span>
              </div>

              <div className="details-row">
                <span className="details-label">Eligibility</span>
                <span className="details-value">
                  {detailsEvent.eligibility || "Not provided"}
                </span>
              </div>

              <div className="details-row">
                <span className="details-label">Entry Fee</span>
                <span className="details-value">
                  {detailsEvent.entryFee === 0 || detailsEvent.entryFee === "0"
                    ? "Free"
                    : detailsEvent.entryFee || "Not provided"}
                </span>
              </div>

              <button className="details-close" onClick={() => setShowDetails(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
