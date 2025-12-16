import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaCalendarAlt,
  FaClock,
  FaEdit,
  FaTrash,
  FaArrowLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AdminEvents.css";
import AdminLayout from "../components/AdminLayout";

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [filterCategory, setFilterCategory] = useState("All");

  // Custom delete confirmation
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    id: null,
    name: "",
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ---------------------------------------------------------
  // FETCH EVENTS
  // ---------------------------------------------------------
  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/events", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch events");

      setEvents(data.events || []);
    } catch (err) {
      toast.error("Failed to load events!");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // ---------------------------------------------------------
  // EDIT EVENT (GO TO FORM PAGE)
  // ---------------------------------------------------------
  const handleEdit = (ev) => {
    navigate(`/admin/create-event/${ev._id}`, { state: { event: ev } });
  };

  // ---------------------------------------------------------
  // DELETE: OPEN CONFIRMATION MODAL
  // ---------------------------------------------------------
  const requestDelete = (id, name) => {
    setConfirmDelete({
      show: true,
      id,
      name,
    });
  };

  // ---------------------------------------------------------
  // DELETE: CONFIRM YES
  // ---------------------------------------------------------
  const confirmDeleteYes = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ show: false, id: null, name: "" });

    const toastId = toast.info("Deleting...", { autoClose: false });

    try {
      const res = await fetch(`http://localhost:5000/api/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");

      toast.dismiss(toastId);
      toast.success("Event deleted successfully!");

      setEvents((prev) => prev.filter((ev) => ev._id !== id));
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || "Delete failed");
    }
  };

  // ---------------------------------------------------------
  // DELETE: CANCEL
  // ---------------------------------------------------------
  const confirmDeleteNo = () => {
    setConfirmDelete({ show: false, id: null, name: "" });
  };

  // ---------------------------------------------------------
  // CATEGORY BADGE
  // ---------------------------------------------------------
  const getCategoryClass = (cat) => {
    if (!cat) return "cat-default";
    const c = cat.toLowerCase();
    if (c.includes("cultural")) return "cat-cultural";
    if (c.includes("tech")) return "cat-tech";
    if (c.includes("sports")) return "cat-sports";
    if (c.includes("workshop")) return "cat-workshop";
    if (c.includes("arts")) return "cat-arts";
    return "cat-default";
  };

  // ---------------------------------------------------------
  // FILTERING (STATUS FILTER REMOVED)
  // ---------------------------------------------------------
  const filteredEvents = events.filter((ev) => {
    const catOk =
      filterCategory === "All" ||
      ev.category?.toLowerCase() === filterCategory.toLowerCase();

    return catOk;
  });

  return (
    <AdminLayout>
      <div className="admin-events-page">

        {/* Filters */}
        <div className="filters-container">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Cultural">Cultural</option>
            <option value="Tech">Tech</option>
            <option value="Arts">Arts</option>
            <option value="Sports">Sports</option>
            <option value="Workshop">Workshop</option>
          </select>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <p className="no-events">No events found.</p>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((ev) => (
              <div className="event-card" key={ev._id}>
                {ev.poster && (
                  <img src={ev.poster} alt={ev.name} className="event-poster" />
                )}

                <h3>{ev.name}</h3>

                <div className="top-row">
                  <span className="left">
                    <FaCalendarAlt /> {ev.date?.split("T")[0]}
                  </span>
                  <span className="right">
                    <FaClock /> {ev.time}
                  </span>
                </div>

                <div className="middle-row">
                  <span className={`category-badge ${getCategoryClass(ev.category)}`}>
                    {ev.category}
                  </span>
                </div>

                <div className="participants">
                  <FaUsers /> {ev.registeredCount || 0} Participants
                </div>

                <div className="action-buttons">
                  <button className="edit-btn" onClick={() => handleEdit(ev)}>
                    <FaEdit />
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => requestDelete(ev._id, ev.name)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <button className="floating-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft color="#fff" />
        </button>

        {/* Delete Confirmation Modal */}
        {confirmDelete.show && (
          <div className="confirm-overlay">
            <div className="confirm-box">
              <h3>Delete Event</h3>
              <p>
                Are you sure you want to delete{" "}
                <strong>{confirmDelete.name}</strong>?
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

        <ToastContainer position="top-center" autoClose={2000} />
      </div>
    </AdminLayout>
  );
};

export default AdminEvents;
