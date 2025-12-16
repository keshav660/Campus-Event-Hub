import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import "./CreateEvent.css";

const CreateEvent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // event id for editing
  const token = localStorage.getItem("token");

  const [posterPreview, setPosterPreview] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyEvent = {
    name: "",
    description: "",
    date: "",
    time: "",
    category: "",
    college: "",
    location: "",
    prizes: "",
    eligibility: "",
    entryFee: "",
    status: "approved",
    poster: "",
  };

  const [eventData, setEventData] = useState(emptyEvent);

  // ---------------------------------------------------------------
  // LOAD EVENT FOR EDITING
  // - Supports two flows:
  //   1) Route param: /admin/create-event/:id  (useParams id)
  //   2) Navigation state: navigate(path, { state: { event } })
  // ---------------------------------------------------------------
  useEffect(() => {
    // If parent navigated with state (AdminEvents: navigate(..., { state: { event } }))
    // prefer that because it avoids an extra backend call.
    if (location?.state?.event) {
      const ev = location.state.event;
      setEventData({ ...emptyEvent, ...ev });
      setPosterPreview(ev.poster || "");
      setIsEditing(true);
      return; // skip fetching from API
    }

    // If there's an id in params, fetch from backend
    const loadEditEvent = async () => {
      if (!id) return;
      try {
        const res = await axios.get(
          `http://localhost:5000/api/events/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const event = res.data.event;
        setEventData({ ...emptyEvent, ...event });
        setPosterPreview(event.poster || "");
        setIsEditing(true);
      } catch (err) {
        toast.error("Failed to load event details");
      }
    };

    loadEditEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, location]);

  // ---------------------------------------------------------------
  // Poster upload
  // ---------------------------------------------------------------
  const handlePosterUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPosterPreview(reader.result);
      setEventData((prev) => ({ ...prev, poster: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // ---------------------------------------------------------------
  // Input change
  // ---------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  // ---------------------------------------------------------------
  // SAVE OR UPDATE EVENT API
  // - Shows an info toast while request runs
  // - Shows success or error toast after
  // ---------------------------------------------------------------
  const handleSaveEvent = async () => {
    const requiredFields = [
      "name",
      "description",
      "date",
      "time",
      "category",
      "college",
      "location",
    ];

    for (const f of requiredFields) {
      if (!eventData[f]) {
        toast.error("Please fill all required fields!");
        return;
      }
    }

    setSaving(true);
    const inProgressToastId = toast.info(
      isEditing ? "Updating event..." : "Saving event...",
      { autoClose: false }
    );

    try {
      let res;

      // Determine the target id: prefer route id, else the eventData._id (if navigation state provided it)
      const targetId = id || eventData._id || eventData.id;

      if (isEditing && targetId) {
        // UPDATE EVENT
        res = await axios.put(
          `http://localhost:5000/api/events/${targetId}`,
          eventData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.dismiss(inProgressToastId);
        toast.success("Event updated successfully!");
      } else {
        // CREATE EVENT
        res = await axios.post(
          "http://localhost:5000/api/events",
          eventData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.dismiss(inProgressToastId);
        toast.success("Event created successfully!");
      }

      // after success navigate back to admin dashboard (keeps behavior identical)
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 700);
    } catch (err) {
      toast.dismiss(inProgressToastId);
      const msg =
        err.response?.data?.message || "Something went wrong while saving event";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------
  // Cancel
  // ---------------------------------------------------------------
  const handleCancel = () => {
    navigate("/admin/dashboard");
  };

  return (
    <div className="create-event-page">
      <h2 className="create-title">
        {isEditing ? "Edit Event" : "Create New Event"}
      </h2>

      <div className="center-container">
        <form
          className="event-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveEvent();
          }}
        >
          <div className="input-group">
            <label>Event Title</label>
            <input
              type="text"
              name="name"
              value={eventData.name}
              placeholder="e.g. Tech Fest 2025"
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea
              name="description"
              value={eventData.description}
              placeholder="Brief about the event"
              rows="3"
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="input-group half">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={eventData.date}
                onChange={handleChange}
              />
            </div>

            <div className="input-group half">
              <label>Time</label>
              <input
                type="time"
                name="time"
                value={eventData.time}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Category</label>
            <select
              name="category"
              value={eventData.category}
              onChange={handleChange}
            >
              <option value="">Select Category</option>
              <option value="Tech">Tech</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Workshop">Workshop</option>
            </select>
          </div>

          <div className="input-group">
            <label>Organized By</label>
            <input
              type="text"
              name="college"
              placeholder="e.g. IIT Delhi or Infosys"
              value={eventData.college}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              placeholder="e.g. Main Auditorium"
              value={eventData.location}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Prizes</label>
            <input
              type="text"
              name="prizes"
              value={eventData.prizes}
              placeholder="e.g. ₹2000 + Certificates"
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Eligibility</label>
            <input
              type="text"
              name="eligibility"
              placeholder="e.g. Open to all students"
              value={eventData.eligibility}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Entry Fee</label>
            <input
              type="number"
              name="entryFee"
              placeholder="e.g. 100"
              value={eventData.entryFee}
              onChange={handleChange}
            />
          </div>

          <div className="input-group upload-container">
            <label>Event Poster</label>

            <div className="poster-preview-box">
              {posterPreview ? (
                <img
                  src={posterPreview}
                  alt="Poster Preview"
                  className="poster-preview"
                />
              ) : (
                <p className="poster-placeholder">No poster uploaded yet.</p>
              )}
            </div>

            <div className="upload-box">
              <label htmlFor="posterUpload" className="upload-label">
                {posterPreview ? "Change Poster" : "Upload Poster"}
              </label>
              <input
                id="posterUpload"
                type="file"
                accept="image/*"
                onChange={handlePosterUpload}
              />
            </div>
          </div>

          <div className="action-buttons">
            <button
              type="submit"
              className="btn black"
              onClick={handleSaveEvent}
              disabled={saving}
            >
              {saving
                ? isEditing
                  ? "Updating..."
                  : "Saving..."
                : isEditing
                ? "Update Event"
                : "Save Event"}
            </button>
          </div>
        </form>
      </div>

      <button className="floating-back-btn" onClick={handleCancel}>
        &#8592;
      </button>
    </div>
  );
};

export default CreateEvent;
