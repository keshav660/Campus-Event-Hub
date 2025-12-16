// import React, { useState, useEffect, useRef } from "react";
// import ReactDOM from "react-dom";
// import "./FeedbackModal.css";
// import { submitFeedback } from "../utils/api";   // ⭐ ADDED
// import { toast } from "react-toastify";          // ⭐ ADDED

// /**
//  * FeedbackModal
//  * Props:
//  * - open
//  * - onClose
//  * - eventId
//  * - eventTitle
//  * - onSubmitted (optional)
//  */
// const FeedbackModal = ({ open, onClose, eventId, eventTitle, onSubmitted }) => {
//   const [rating, setRating] = useState(0);
//   const [hover, setHover] = useState(0);
//   const [feedback, setFeedback] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const modalRef = useRef(null);

//   // Reset when closed
//   useEffect(() => {
//     if (!open) {
//       setRating(0);
//       setHover(0);
//       setFeedback("");
//       setSubmitting(false);
//     }
//   }, [open]);

//   // Prevent body scroll
//   useEffect(() => {
//     if (!open) return;
//     const prevOverflow = document.body.style.overflow;
//     document.body.style.overflow = "hidden";

//     if (modalRef.current) modalRef.current.focus();

//     return () => {
//       document.body.style.overflow = prevOverflow || "";
//     };
//   }, [open]);

//   if (!open) return null;

//   // ⭐ NEW: Hook to backend using submitFeedback()
//   const handleSubmit = async () => {
//     if (rating === 0) {
//       toast.error("Please rate the event (1–5 stars).");
//       return;
//     }

//     setSubmitting(true);

//     try {
//       await submitFeedback(eventId, {
//         rating,
//         comment: feedback,
//       });

//       toast.success("Feedback submitted successfully!");

//       if (onSubmitted) onSubmitted({ rating, feedback });

//       onClose();
//     } catch (err) {
//       toast.error(err.message || "Failed to submit feedback.");
//     }

//     setSubmitting(false);
//   };

//   const modalContent = (
//     <div
//       className="feedback-modal-backdrop"
//       role="presentation"
//       onMouseDown={(e) => {
//         if (e.target === e.currentTarget) onClose();
//       }}
//     >
//       <div
//         className="feedback-modal"
//         role="dialog"
//         aria-modal="true"
//         aria-label={`Feedback for ${eventTitle}`}
//         tabIndex={-1}
//         ref={modalRef}
//       >
//         <div className="feedback-header">
//           <h3>Event Feedback</h3>
//           <button
//             className="feedback-close"
//             onClick={onClose}
//             aria-label="Close"
//             type="button"
//           >
//             ✕
//           </button>
//         </div>

//         <p className="feedback-subheading">
//           Share your experience about <strong>{eventTitle}</strong>
//         </p>

//         {/* ⭐ STAR RATING */}
//         <label className="rating-label">Rate this event *</label>
//         <div className="stars" aria-label={`Rating ${rating} of 5`}>
//           {[1, 2, 3, 4, 5].map((i) => (
//             <button
//               key={i}
//               type="button"
//               className={"star " + (i <= (hover || rating) ? "filled" : "")}
//               onClick={() => setRating(i)}
//               onMouseEnter={() => setHover(i)}
//               onMouseLeave={() => setHover(0)}
//             >
//               ★
//             </button>
//           ))}
//         </div>

//         {/* ⭐ FEEDBACK TEXT */}
//         <label className="feedback-label">Your Feedback *</label>
//         <textarea
//           className="feedback-text"
//           value={feedback}
//           onChange={(e) => setFeedback(e.target.value)}
//           placeholder="Describe your experience..."
//           rows={4}
//         />

//         {/* ⭐ BUTTONS */}
//         <div className="feedback-actions">
//           <button
//             className="btn btn-primary"
//             onClick={handleSubmit}
//             disabled={submitting}
//             type="button"
//           >
//             {submitting ? "Submitting..." : "Submit Feedback"}
//           </button>

//           <button
//             className="btn btn-ghost"
//             onClick={onClose}
//             disabled={submitting}
//             type="button"
//           >
//             Cancel
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   return ReactDOM.createPortal(modalContent, document.body);
// };

// export default FeedbackModal;
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "./FeedbackModal.css";
import { submitFeedback } from "../utils/api";
import { toast } from "react-toastify";

/**
 * FeedbackModal
 * Props:
 * - open
 * - onClose
 * - eventId
 * - eventTitle
 * - onSubmitted (optional)
 */
const FeedbackModal = ({ open, onClose, eventId, eventTitle, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef(null);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setRating(0);
      setHover(0);
      setFeedback("");
      setSubmitting(false);
    }
  }, [open]);

  // Prevent body scroll and focus modal
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (modalRef.current) {
      modalRef.current.focus();
    }

    return () => {
      document.body.style.overflow = prevOverflow || "";
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please rate the event (1–5 stars).");
      return;
    }

    setSubmitting(true);

    try {
      await submitFeedback(eventId, {
        rating,
        comment: feedback,
      });

      toast.success("Feedback submitted successfully!");

      if (onSubmitted) {
        onSubmitted({ rating, feedback });
      }

      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to submit feedback.");
    }

    setSubmitting(false);
  };

  const modalContent = (
    <div
      className="feedback-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="feedback-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Feedback for ${eventTitle}`}
        tabIndex={-1}
        ref={modalRef}
      >
        <div className="feedback-header">
          <h3>Event Feedback</h3>
          <button
            className="feedback-close"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        <p className="feedback-subheading">
          Share your experience about <strong>{eventTitle}</strong>
        </p>

        {/* STAR RATING */}
        <label className="rating-label">Rate this event *</label>
        <div className="stars" aria-label={`Rating ${rating} of 5`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              className={"star " + (i <= (hover || rating) ? "filled" : "")}
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
            >
              ★
            </button>
          ))}
        </div>

        {/* FEEDBACK TEXT */}
        <label className="feedback-label">Your Feedback *</label>
        <textarea
          className="feedback-text"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Describe your experience..."
          rows={4}
        />

        {/* BUTTONS */}
        <div className="feedback-actions">
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
            type="button"
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>

          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={submitting}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default FeedbackModal;
