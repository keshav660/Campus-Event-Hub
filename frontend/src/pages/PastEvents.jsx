// src/pages/PastEvents.jsx
import React, { useEffect, useState, useMemo } from "react";
import StudentLayout from "../components/StudentLayout";
import { FaCalendarAlt, FaClock, FaUniversity } from "react-icons/fa";
import FeedbackModal from "../components/FeedbackModal";
import "./PastEvents.css";

const API_EVENTS = "http://localhost:5000/api/events?status=approved";

// Safe date checker
const safeDate = (ev) => {
  if (!ev) return "";
  const raw = ev.date || ev.eventDate;
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

const PastEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackEventId, setFeedbackEventId] = useState(null);
  const [feedbackEventTitle, setFeedbackEventTitle] = useState("");

  // Details modal
  const [showDetails, setShowDetails] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState(null);

  // Fetch events
  useEffect(() => {
    let mounted = true;

    const loadFallback = () => {
      try {
        const cache = JSON.parse(localStorage.getItem("createdEvents") || "[]");
        return Array.isArray(cache) ? cache : [];
      } catch {
        return [];
      }
    };

    const loadEvents = async () => {
      setLoading(true);
      setErr(null);

      try {
        const res = await fetch(API_EVENTS);

        if (!res.ok) {
          if (mounted) {
            setErr("Could not connect to API. Showing cached events.");
            setEvents(loadFallback());
          }
        } else {
          const data = await res.json();
          const list = Array.isArray(data.events) ? data.events : [];

          if (mounted) setEvents(list);
          localStorage.setItem("createdEvents", JSON.stringify(list));
        }
      } catch {
        if (mounted) {
          setErr("Network error. Loaded cached events.");
          setEvents(loadFallback());
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadEvents();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter past events
  const pastEvents = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return events.filter((ev) => {
      const d = safeDate(ev);
      return d && d < today;
    });
  }, [events]);

  const openDetails = (ev) => {
    setDetailsEvent(ev);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setDetailsEvent(null);
    setShowDetails(false);
  };

  return (
    <StudentLayout>
      <div className="past-events-page">
        <header className="past-header">
          <div>
            <h1>Past Events</h1>
            <p className="subtitle">
              Browse events that already happened and share your feedback
            </p>
          </div>
        </header>

        <main className="past-main">
          {loading ? (
            <div className="grid past-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="card skeleton" key={i}>
                  <div className="s-img" />
                  <div className="s-row short" />
                  <div className="s-row" />
                  <div className="s-row long" />
                </div>
              ))}
            </div>
          ) : err && pastEvents.length === 0 ? (
            <div className="empty-state">
              <p>{err}</p>
            </div>
          ) : pastEvents.length === 0 ? (
            <div className="empty-state">
              <h3>No past events found</h3>
              <p>Past events will appear here once they are completed.</p>
            </div>
          ) : (
            <div className="grid past-grid">
              {pastEvents.map((ev, idx) => {
                const id = ev._id || ev.id || `pe-${idx}`;
                const title = ev.name || ev.title || "Untitled Event";
                const desc = ev.description || "No description provided.";
                const poster = ev.poster || "";
                const date = safeDate(ev);
                const time = ev.time || "N/A";

                return (
                  <article className="card" key={id}>
                    {/* MEDIA BOX - NOW PURE CSS, NO INLINE FIX NEEDED */}
                    <div className="card-media">
                      {poster ? (
                        <img src={poster} alt={title} loading="lazy" />
                      ) : (
                        <div className="no-media">No Image</div>
                      )}
                    </div>

                    <div className="card-body">
                      <div className="title-row">
                        <h3 className="card-title">{title}</h3>

                        <button
                          className="eye-btn"
                          title={`View details for ${title}`}
                          onClick={() => openDetails(ev)}
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
                          >
                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                      </div>

                      <p className="card-desc">{desc}</p>

                      <div className="card-meta">
                        <span>
                          <FaClock /> {time}
                        </span>
                        <span>
                          <FaCalendarAlt /> {date}
                        </span>

                        {ev.college && (
                          <span className="meta-right">
                            <FaUniversity /> {ev.college}
                          </span>
                        )}
                      </div>

                      <div className="card-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setFeedbackEventId(id);
                            setFeedbackEventTitle(title);
                            setShowFeedbackModal(true);
                          }}
                        >
                          Give Feedback
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        {/* FEEDBACK MODAL */}
        {showFeedbackModal && (
          <FeedbackModal
            open={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            eventId={feedbackEventId}
            eventTitle={feedbackEventTitle}
          />
        )}

        {/* DETAILS MODAL */}
        {showDetails && detailsEvent && (
          <div className="details-modal-overlay" onClick={closeDetails}>
            <div
              className="details-modal"
              onClick={(e) => e.stopPropagation()}
            >
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
                  {detailsEvent.entryFee === 0 ||
                  detailsEvent.entryFee === "0"
                    ? "Free"
                    : detailsEvent.entryFee || "Not provided"}
                </span>
              </div>

              <div className="details-close-wrapper">
                <button className="details-close" onClick={closeDetails}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default PastEvents;
