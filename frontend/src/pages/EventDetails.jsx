
// export default EventDetails;
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaUserGraduate,
  FaGift,
  FaRupeeSign,
  FaArrowLeft,
  FaUsers,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getRequest, postRequest } from "../utils/api";
import FeedbackModal from "../components/FeedbackModal";
import "./EventDetails.css";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState(0);

  // FEEDBACK STATES
  const [rating, setRating] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const token = localStorage.getItem("token");

  // ------------------------------------------------------
  // Fetch event + feedback
  // ------------------------------------------------------
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const res = await getRequest(`/events/${id}`);

        if (!res?.event) {
          toast.error("Event not found");
          return;
        }

        setEvent(res.event);
        setRegistrations(res.registrations || 0);

        // Fetch rating + feedback list
        try {
          const feedbackRes = await getRequest(`/feedback/${id}`);

          if (feedbackRes?.stats) {
            setRating(feedbackRes.stats);
          }

          // 🔧 backend returns "feedbacks", not "feedback"
          if (feedbackRes?.feedbacks) {
            setFeedbackList(feedbackRes.feedbacks);
          }
        } catch (err) {
          console.log("No feedback found or failed to load feedback");
        }
      } catch (err) {
        toast.error(err.message || "Failed to load event");
      }
    };

    fetchEventDetails();
  }, [id]);

  // ------------------------------------------------------
  // Register user
  // ------------------------------------------------------
  const handleRegister = async () => {
    if (!token) {
      toast.warn("Please login first!");
      navigate("/login");
      return;
    }

    try {
      const res = await postRequest(`/events/${id}/register`, {});
      toast.success(res.message || "Registration successful!");
      setRegistrations((prev) => prev + 1);
    } catch (err) {
      toast.error(err.message || "Registration failed!");
    }
  };

  const handleBack = () => navigate(-1);

  if (!event) {
    return (
      <div className="event-details-page">
        <div className="event-card">
          <h2 className="event-title">Event Not Found</h2>
          <button className="btn back-btn" onClick={handleBack}>
            <FaArrowLeft /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="event-details-page"
      style={{
        backgroundImage: event.poster ? `url(${event.poster})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="event-overlay">
        <div className="event-card">
          <h2 className="event-title">{event.name}</h2>
          <p className="event-desc">{event.description}</p>

          {/* RATING DISPLAY */}
          {rating && (
            <div style={{ marginTop: "8px", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: "22px", color: "#f5b50a" }}>
                  {"⭐".repeat(Math.round(rating.averageRating || 0))}
                </span>
                <span style={{ marginLeft: "10px", color: "#444" }}>
                  ({rating.averageRating} / 5 · {rating.totalFeedbacks} reviews)
                </span>
              </div>
            </div>
          )}

          <div className="details-grid">
            <p>
              <FaCalendarAlt /> <strong>Date:</strong>{" "}
              {new Date(event.date).toLocaleDateString()}
            </p>
            <p>
              <FaClock /> <strong>Time:</strong> {event.time}
            </p>
            <p>
              <FaMapMarkerAlt /> <strong>Location:</strong> {event.location}
            </p>
            <p>
              <FaGift /> <strong>Category:</strong> {event.category}
            </p>
            <p>
              <FaUserGraduate /> <strong>Eligibility:</strong>{" "}
              {event.eligibility}
            </p>
            <p>
              <FaGift /> <strong>Prizes:</strong> {event.prizes}
            </p>
            <p>
              <FaRupeeSign /> <strong>Entry Fee:</strong>{" "}
              {event.entryFee ? `₹${event.entryFee}` : "Free"}
            </p>
            <p>
              <FaUsers /> <strong>Registrations:</strong> {registrations}
            </p>
          </div>

          <div className="btn-container">
            <button className="btn register-btn" onClick={handleRegister}>
              Register Now
            </button>

            <button className="btn back-btn" onClick={handleBack}>
              <FaArrowLeft /> Back
            </button>

            {/* WRITE FEEDBACK BUTTON */}
            <button
              className="btn review-btn"
              onClick={() => setShowFeedbackModal(true)}
            >
              Write Feedback
            </button>
          </div>

          {/* FULL FEEDBACK LIST */}
          <div className="feedback-section">
            <h3 className="feedback-title">Student Feedback</h3>

            {feedbackList.length === 0 ? (
              <p className="no-feedback">No feedback yet.</p>
            ) : (
              feedbackList.map((fb) => (
                <div key={fb._id} className="feedback-card">
                  <div className="feedback-header">
                    <strong>{fb.user?.name || "Anonymous"}</strong>
                    <span className="feedback-date">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="feedback-stars">
                    {"⭐".repeat(fb.rating)}
                    {"☆".repeat(5 - fb.rating)}
                  </div>

                  {fb.comment && (
                    <p className="feedback-text">{fb.comment}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* FEEDBACK MODAL */}
      <FeedbackModal
        open={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        eventId={id}
        eventTitle={event.name}
        onSubmitted={() => {
          // If you want, you can re-fetch feedback here.
          toast.success("Thanks for your feedback!");
          setShowFeedbackModal(false);
        }}
      />

      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
};

export default EventDetails;
