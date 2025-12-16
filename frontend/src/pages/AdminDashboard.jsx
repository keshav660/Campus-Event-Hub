// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  FaCalendarCheck,
  FaUserGraduate,
  FaChartBar,
  FaCog,
  FaCalendarAlt,
  FaClock,
  FaTrash,
  FaEdit,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./AdminDashboard.css";
import AdminLayout from "../components/AdminLayout";
import { getRequest } from "../utils/api";

/**
 * Admin Dashboard
 * - shows stats
 * - shows top events (first 3)
 * - supports edit (navigate to create-event with state) and delete (custom modal + toast)
 *
 * Notes:
 * - Place a global `import "react-toastify/dist/ReactToastify.css";` in App.js once.
 * - This file uses a tiny inline SVG fallback for images to avoid external placeholder DNS errors.
 */

// small inline svg fallback (no external network)
const SAFE_FALLBACK = `data:image/svg+xml;utf8,` + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120">
     <rect width="100%" height="100%" fill="#e6e9ef"/>
     <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8b93a7" font-family="Arial" font-size="16">No image</text>
   </svg>`
);

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    approvedEvents: 0,
    pendingEvents: 0,
    rejectedEvents: 0,
    totalRegistrations: 0,
    pendingRegistrations: 0,
  });

  // Confirm delete modal state
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    id: null,
    name: "",
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Helper: normalize poster -> use local fallback if external placeholder or empty
  const normalizePoster = (posterUrl) => {
    if (!posterUrl) return SAFE_FALLBACK;
    const lower = String(posterUrl).toLowerCase();
    if (lower.includes("via.placeholder.com") || lower.includes("placeholder.com")) {
      return SAFE_FALLBACK;
    }
    return posterUrl;
  };

  // ----------------------------------------------------------
  // FETCH EVENTS (and normalize poster URLs)
  // ----------------------------------------------------------
  const fetchEvents = async () => {
    try {
      const res = await getRequest("/events", token);
      const rawEvents = res.events || [];

      const processed = rawEvents.map((ev) => ({
        ...ev,
        poster: normalizePoster(ev.poster),
      }));

      setEvents(processed);
    } catch (err) {
      console.error("fetchEvents error:", err);
      toast.error("Failed to fetch events");
    }
  };

  // ----------------------------------------------------------
  // FETCH STATS
  // ----------------------------------------------------------
  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/stats/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("fetchStats failed:", data);
        return toast.error(data.message || "Stats load failed");
      }

      setStats(data);
    } catch (err) {
      console.error("fetchStats error:", err);
      toast.error("Stats load failed: " + err.message);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusClass = (status) => {
    if (!status) return "status-pending";
    switch (status.toLowerCase()) {
      case "approved":
        return "status-active";
      case "pending":
        return "status-pending";
      case "rejected":
        return "status-completed";
      default:
        return "status-pending";
    }
  };

  const getCategoryClass = (cat) => {
    if (!cat) return "cat-default";
    const c = cat.toLowerCase();
    if (c.includes("cultural")) return "cat-cultural";
    if (c.includes("tech")) return "cat-tech";
    if (c.includes("arts")) return "cat-arts";
    if (c.includes("workshop")) return "cat-workshop";
    if (c.includes("sports")) return "cat-sports";
    return "cat-default";
  };

  // ----------------------------------------------------------
  // Request delete: show confirm modal
  // ----------------------------------------------------------
  const requestDeleteEvent = (id, name) => {
    setConfirmDelete({ show: true, id, name });
  };

  // ----------------------------------------------------------
  // Confirm delete YES -> call API
  // ----------------------------------------------------------
  const confirmDeleteYes = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ show: false, id: null, name: "" });

    const infoToastId = toast.info("Deleting event...", { autoClose: false });

    try {
      const res = await fetch(`http://localhost:5000/api/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");

      toast.dismiss(infoToastId);
      toast.success("Event deleted!");
      // Refresh UI
      await fetchEvents();
      await fetchStats();
    } catch (err) {
      toast.dismiss(infoToastId);
      console.error("delete error:", err);
      toast.error(err.message || "Delete failed");
    }
  };

  // ----------------------------------------------------------
  // Confirm delete NO -> close modal
  // ----------------------------------------------------------
  const confirmDeleteNo = () => {
    setConfirmDelete({ show: false, id: null, name: "" });
  };

  const handleEditEvent = (event) => {
    // pass event in navigation state to avoid re-fetching in CreateEvent
    navigate(`/admin/create-event/${event._id}`, { state: { event } });
  };

  // ----------------------------------------------------------
  // Display only 3 most recently created events
  // ----------------------------------------------------------
  const displayedEvents = [...events]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  return (
    <AdminLayout>
      <div className="dashboard-content">
        {/* ---------- Stats ---------- */}
        <section className="stats-container">
          <div className="stat-card">
            <div className="stat-left">
              <FaCalendarCheck className="stat-icon" />
              <p>Total Events</p>
            </div>
            <h2>{stats.totalEvents}</h2>
          </div>

          <div className="stat-card">
            <div className="stat-left">
              <FaUserGraduate className="stat-icon" />
              <p>Total Registrations</p>
            </div>
            <h2>{stats.totalRegistrations}</h2>
          </div>

          <div className="stat-card">
            <div className="stat-left">
              <FaChartBar className="stat-icon" />
              <p>Pending Approvals</p>
            </div>
            <h2>{stats.pendingRegistrations}</h2>
          </div>

          <div className="stat-card">
            <div className="stat-left">
              <FaCog className="stat-icon" />
              <p>Approved Events</p>
            </div>
            <h2>{stats.approvedEvents}</h2>
          </div>
        </section>

        {/* ---------- Event Table ---------- */}
        <section className="event-section">
          <div className="event-header">
            <h3>Event Management</h3>
            <p>Manage all campus events efficiently</p>
          </div>

          <div className="table-wrapper">
            <table className="event-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date & Time</th>
                  <th>Category</th>
                  <th>Participants</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {displayedEvents.length ? (
                  displayedEvents.map((ev) => (
                    <tr key={ev._id}>
                      <td>{ev.name}</td>

                      <td>
                        <FaCalendarAlt /> {ev.date ? ev.date.split("T")[0] : "N/A"}{" "}
                        <br />
                        <FaClock /> {ev.time || "N/A"}
                      </td>

                      <td>
                        <span className={`category-badge ${getCategoryClass(ev.category)}`}>
                          {ev.category || "General"}
                        </span>
                      </td>

                      <td>
                        <FaUsers /> {ev.registeredCount || 0}
                      </td>

                      <td>
                        <span className={`status ${getStatusClass(ev.status)}`}>
                          {ev.status || "pending"}
                        </span>
                      </td>

                      <td>
                        <button className="edit-btn" onClick={() => handleEditEvent(ev)}>
                          <FaEdit />
                        </button>

                        <button className="delete-btn" onClick={() => requestDeleteEvent(ev._id, ev.name)}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      No events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <button
          className="create-fab-bottom-right"
          onClick={() => navigate("/admin/create-event")}
          title="Create Event"
        >
          <span className="plus">+</span>
        </button>

        {/* ---------- Confirm Delete Modal ---------- */}
        {confirmDelete.show && (
          <div className="confirm-overlay">
            <div className="confirm-box">
              <h4>Delete Event</h4>
              <p>
                Are you sure you want to delete{" "}
                <strong>{confirmDelete.name || "this event"}</strong>?
              </p>
              <div className="confirm-actions">
                <button className="btn btn-danger" onClick={confirmDeleteYes}>
                  Yes
                </button>
                <button className="btn btn-secondary" onClick={confirmDeleteNo}>
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
