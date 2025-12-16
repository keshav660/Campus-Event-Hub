// src/pages/MyRegistrations.jsx
import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaInfoCircle,
  FaTrash,
  FaSearch,
  FaFilter,
  FaEnvelope,
  FaUser,
  FaUniversity,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import StudentLayout from "../components/StudentLayout";
import "./MyRegistrations.css";

const API = "http://localhost:5000/api/registrations";
const API_EVENTS = "http://localhost:5000/api/events"; // used to fetch full event details if needed

const MyRegistrations = () => {
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // NEW: details modal state
  const [showDetails, setShowDetails] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // NEW: cancel confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // registration object being cancelled
  const [confirmLoading, setConfirmLoading] = useState(false);

  const token = localStorage.getItem("token");

  // -------------------------
  // Helper utilities
  // -------------------------
  const norm = (s) => {
    if (s === undefined || s === null) return "";
    return String(s).trim().toLowerCase();
  };

  // =====================================
  // LOAD FROM BACKEND
  // =====================================
  const loadFromBackend = async () => {
    try {
      const res = await fetch(`${API}/my`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        toast.error("Please login again");
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");

      setMyRegistrations(data.registrations || []);
    } catch (err) {
      toast.error(err.message || "Failed to load registrations");
    }
  };

  useEffect(() => {
    loadFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================
  // CANCEL REGISTRATION (CONFIRMED)
  // =====================================
  const confirmCancelRegistration = async () => {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    try {
      const res = await fetch(`${API}/${confirmTarget._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.status === 401) {
        throw new Error("Access denied: please login");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to cancel registration");
      }

      toast.success("Registration cancelled!");
      setConfirmOpen(false);
      setConfirmTarget(null);
      await loadFromBackend();
    } catch (err) {
      toast.error(err.message || "Cancel failed");
    } finally {
      setConfirmLoading(false);
    }
  };

  // =====================================
  // OPEN CANCEL CONFIRM
  // =====================================
  const openCancelConfirm = (reg) => {
    setConfirmTarget(reg);
    setConfirmOpen(true);
  };

  // =====================================
  // STATUS ICONS / CLASSES (use normalized status)
  // =====================================
  const getStatusIcon = (statusRaw) => {
    const s = norm(statusRaw);
    switch (s) {
      case "approved":
        return <FaCheckCircle className="status-icon approved" />;
      case "rejected":
        return <FaTimesCircle className="status-icon rejected" />;
      default:
        return <FaHourglassHalf className="status-icon pending" />;
    }
  };

  const getStatusClass = (statusRaw) => {
    const s = norm(statusRaw);
    switch (s) {
      case "approved":
        return "status-approved";
      case "rejected":
        return "status-rejected";
      default:
        return "status-pending";
    }
  };

  // =====================================
  // FILTERING (normalized)
  // =====================================
  const filteredRegistrations = myRegistrations.filter((reg) => {
    const regStatus = norm(reg.status);

    const statusMatch =
      filterStatus === "all" || regStatus === norm(filterStatus);

    const searchMatch =
      searchTerm === "" ||
      (reg.event?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  const stats = {
    total: myRegistrations.length,
    pending: myRegistrations.filter((r) => norm(r.status) === "pending").length,
    approved: myRegistrations.filter((r) => norm(r.status) === "approved")
      .length,
    rejected: myRegistrations.filter((r) => norm(r.status) === "rejected")
      .length,
  };

  const formatDate = (dt) => {
    if (!dt) return "N/A";
    return new Date(dt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper: try to get property from multiple possible keys
  const getField = (obj, keys = []) => {
    if (!obj) return null;
    for (const k of keys) {
      if (
        Object.prototype.hasOwnProperty.call(obj, k) &&
        obj[k] !== undefined &&
        obj[k] !== null &&
        obj[k] !== ""
      ) {
        return obj[k];
      }
    }
    return null;
  };

  // Try to fetch full event details by id if backend supports it
  const fetchFullEventById = async (eventId) => {
    if (!eventId) return null;
    try {
      const res = await fetch(`${API_EVENTS}/${eventId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      const data = await res.json();
      // many APIs return { event: {...} } or the event directly — handle both
      return data.event || data;
    } catch {
      return null;
    }
  };

  // =====================================
  // DETAILS modal open (robust)
  // =====================================
  const openDetails = async (eventObj) => {
    // eventObj might be reg.event or the reg itself; accept both
    let ev = eventObj?.event ? eventObj.event : eventObj;
    setDetailsEvent(ev);
    setShowDetails(true);

    // Log it for debugging (open devtools console to inspect)
    // eslint-disable-next-line no-console
    console.log("openDetails - initial object:", eventObj, ev);

    // check if key fields exist; if not, try fetching full event
    const hasAnyDetail =
      getField(ev, ["location", "venue", "place"]) ||
      getField(ev, ["prizes", "prize", "rewards"]) ||
      getField(ev, ["eligibility", "eligible", "eligibilityCriteria"]) ||
      getField(ev, ["entryFee", "entry_fee", "fee", "price"]);

    if (!hasAnyDetail) {
      // try to fetch by id (if available)
      const eventId =
        ev?._id || ev?.id || eventObj?.event?._id || eventObj?.event?.id;
      if (eventId) {
        setDetailsLoading(true);
        const full = await fetchFullEventById(eventId);
        setDetailsLoading(false);
        // log fetched full event
        // eslint-disable-next-line no-console
        console.log("Fetched full event for details modal:", full);
        if (full) {
          setDetailsEvent(full);
        }
      }
    }
  };

  // helper to determine if event is past (date-only comparison)
  const isEventPast = (event) => {
    // Accept either a registration object, or an event object
    const eventDateRaw =
      event?.date || event?.event?.date || (event?.event || {}).date || "";
    if (!eventDateRaw) return false;
    const eventDate =
      eventDateRaw.split && eventDateRaw.split("T")[0]
        ? eventDateRaw.split("T")[0]
        : eventDateRaw;
    const today = new Date().toISOString().split("T")[0];
    return eventDate < today;
  };

  return (
    <StudentLayout>
      <ToastContainer position="top-center" autoClose={2000} />

      <div className="my-registrations-container">
        {/* Header */}
        <div className="page-header">
          <h1>My Event Registrations</h1>
          <p>Track your event registrations and approval status</p>
        </div>

        {/* Stats */}
        <section className="stats-grid">
          <div className="stat-card-mini total">
            <h3>{stats.total}</h3>
            <p>Total Registrations</p>
          </div>

          <div className="stat-card-mini pending">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>

          <div className="stat-card-mini approved">
            <h3>{stats.approved}</h3>
            <p>Approved</p>
          </div>

          <div className="stat-card-mini rejected">
            <h3>{stats.rejected}</h3>
            <p>Rejected</p>
          </div>
        </section>

        {/* Filters */}
        <section className="filters-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search event or student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-buttons">
            <button
              className={filterStatus === "all" ? "active" : ""}
              onClick={() => setFilterStatus("all")}
            >
              <FaFilter /> All
            </button>

            <button
              className={filterStatus === "pending" ? "active" : ""}
              onClick={() => setFilterStatus("pending")}
            >
              <FaClock /> Pending
            </button>

            <button
              className={filterStatus === "approved" ? "active" : ""}
              onClick={() => setFilterStatus("approved")}
            >
              <FaCheckCircle /> Approved
            </button>

            <button
              className={filterStatus === "rejected" ? "active" : ""}
              onClick={() => setFilterStatus("rejected")}
            >
              <FaTimesCircle /> Rejected
            </button>
          </div>
        </section>

        {/* Registrations */}
        <section className="registrations-section">
          <h2>Your Registrations</h2>

          {filteredRegistrations.length === 0 ? (
            <div className="no-data">
              <FaInfoCircle size={40} />
              <p>No registrations found.</p>
            </div>
          ) : (
            <div className="registrations-grid">
              {filteredRegistrations.map((reg) => (
                <div key={reg._id} className="registration-card">
                  <div className="registration-card-header">
                    {reg.event?.poster ? (
                      <img
                        src={reg.event.poster}
                        alt={reg.event.name}
                        className="event-thumbnail"
                      />
                    ) : (
                      <div className="event-thumbnail-placeholder">
                        <FaCalendarAlt size={30} />
                      </div>
                    )}

                    <div className={`status-badge ${getStatusClass(reg.status)}`}>
                      {getStatusIcon(reg.status)}
                      <span>{(reg.status || "pending").toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="registration-card-body">
                    {/* Title row with Eye icon */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <h3>{reg.event?.name || "No Event Name"}</h3>

                      {/* Eye Icon Button */}
                      <button
                        className="eye-btn"
                        title={`View details for ${reg.event?.name || ""}`}
                        onClick={() => openDetails(reg)}
                        aria-label={`View details for ${reg.event?.name || ""}`}
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

                    <div className="registration-details">
                      <div className="detail-item">
                        <FaUser className="detail-icon" />
                        <span>{reg.user?.name || "N/A"}</span>
                      </div>

                      <div className="detail-item">
                        <FaEnvelope className="detail-icon" />
                        <span>{reg.user?.email || "N/A"}</span>
                      </div>

                      <div className="detail-item">
                        <FaUniversity className="detail-icon" />
                        <span>{reg.event?.college || "N/A"}</span>
                      </div>

                      <div className="detail-item">
                        <FaCalendarAlt className="detail-icon" />
                        <span>{reg.event?.date?.split("T")[0] || "N/A"}</span>
                      </div>

                      <div className="detail-item registered-at">
                        <small>Registered: {formatDate(reg.createdAt)}</small>
                      </div>
                    </div>
                  </div>

                  <div className="registration-card-footer">
                    {/* show "Completed" for past events instead of Cancel.
                        Completed re-uses the cancel button styling so it appears red. */}
                    {isEventPast(reg) ? (
                      <button
                        className="cancel-registration-btn completed-btn"
                        disabled
                        title="Event completed"
                        aria-label="Event completed"
                      >
                        <FaTimesCircle /> Completed
                      </button>
                    ) : (
                      <button
                        className="cancel-registration-btn"
                        onClick={() => openCancelConfirm(reg)}
                      >
                        <FaTrash /> Cancel Registration
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* DETAILS Modal (robust: reads multiple keys & tries to fetch full event if missing) */}
      {showDetails && detailsEvent && (
        <div className="details-modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            {detailsLoading ? (
              <p>Loading details...</p>
            ) : (
              (() => {
                const ev = detailsEvent?.event ? detailsEvent.event : detailsEvent;
                // helper to read multiple possible keys (fallback order)
                const locationVal = getField(ev, ["location", "venue", "place", "locationName"]);
                const prizesVal = getField(ev, ["prizes", "prize", "rewards", "reward"]);
                const eligibilityVal = getField(ev, ["eligibility", "eligibilityCriteria", "eligible"]);
                const entryFeeVal = getField(ev, ["entryFee", "entry_fee", "fee", "price"]);

                // eslint-disable-next-line no-console
                console.log("DETAILS MODAL - event object shown:", ev);

                return (
                  <>
                    <h2 style={{ marginTop: 0 }}>{ev?.name || "Event Details"}</h2>

                    <div className="details-row">
                      <span className="details-label">Location</span>
                      <span className="details-value">{locationVal ?? "Not provided"}</span>
                    </div>

                    <div className="details-row">
                      <span className="details-label">Prizes</span>
                      <span className="details-value">{prizesVal ?? "Not provided"}</span>
                    </div>

                    <div className="details-row">
                      <span className="details-label">Eligibility</span>
                      <span className="details-value">{eligibilityVal ?? "Not provided"}</span>
                    </div>

                    <div className="details-row">
                      <span className="details-label">Entry Fee</span>
                      <span className="details-value">
                        {entryFeeVal === 0 || entryFeeVal === "0" ? "Free" : entryFeeVal ?? "Not provided"}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
                      <button className="details-close" onClick={() => setShowDetails(false)} style={{ width: 220 }}>
                        Close
                      </button>
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* CANCEL CONFIRM Modal */}
      {confirmOpen && confirmTarget && (
        <div className="confirm-modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Cancel Registration</h3>
            <p style={{ color: "#374151" }}>
              Do you want to cancel registration for{" "}
              <strong>{confirmTarget.event?.name || "this event"}</strong>?
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 14 }}>
              <button
                onClick={confirmCancelRegistration}
                style={{
                  background: "#0b1226",
                  color: "#fff",
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "none",
                  fontWeight: 700,
                  minWidth: 120,
                  cursor: "pointer",
                }}
                disabled={confirmLoading}
              >
                {confirmLoading ? "Cancelling..." : "Yes"}
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                style={{
                  background: "#0b1226", // BLACK
                  color: "#fff", // WHITE TEXT
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "none", // REMOVE WHITE BORDER
                  fontWeight: 700,
                  minWidth: 120,
                  cursor: "pointer",
                }}
                disabled={confirmLoading}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default MyRegistrations;
