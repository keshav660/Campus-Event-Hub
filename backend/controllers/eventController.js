// controllers/eventController.js
const Event = require("../models/Event");
const Registration = require("../models/Registration");

// CREATE EVENT
exports.createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      date,
      time,
      category,
      college,
      location,
      prizes,
      eligibility,
      entryFee,
      status,
      poster
    } = req.body;

    if (!name || !description || !date || !time || !category || !college || !location) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Force ISO Date
    const isoDate = new Date(date);
    if (isNaN(isoDate.getTime())) {
      return res.status(400).json({ message: "Invalid event date format" });
    }
    const finalDate = isoDate.toISOString().split("T")[0];

    const event = new Event({
      name,
      description,
      date: finalDate,
      time,
      category,
      college,
      location,
      prizes,
      eligibility,
      entryFee,
      status: status || "approved",
      poster,
      createdBy: req.user._id
    });

    await event.save();
    res.json({ event });
  } catch (err) {
    console.error("createEvent error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE EVENT (⭐ UPDATED to ensure updatedAt changes)
exports.updateEvent = async (req, res) => {
  try {
    const updatePayload = {
      ...req.body,
      updatedAt: new Date()  // ⭐ VERY IMPORTANT FIX
    };

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      {
        new: true,
        runValidators: true
      }
    );

    if (!event) return res.status(404).json({ message: "Event not found" });

    res.json({ event });
  } catch (err) {
    console.error("updateEvent error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE EVENT + its registrations
exports.deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    await Registration.deleteMany({ event: req.params.id });

    res.json({ message: "Event deleted" });
  } catch (err) {
    console.error("deleteEvent error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// LIST EVENTS
exports.listEvents = async (req, res) => {
  try {
    let filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const events = await Event.find(filter).sort({ date: 1 });

    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const regCount = await Registration.countDocuments({ event: event._id });
        return {
          ...event.toObject(),
          registeredCount: regCount
        };
      })
    );

    res.json({ events: eventsWithCounts });
  } catch (err) {
    console.error("listEvents error:", err);
    res.status(500).json({ message: "Server error loading events" });
  }
};

// GET SINGLE EVENT
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event)
      return res.status(404).json({ message: "Event not found" });

    const count = await Registration.countDocuments({ event: event._id });

    res.json({ event, registrations: count });
  } catch (err) {
    console.error("getEvent error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ⭐⭐⭐ REGISTER STUDENT FOR EVENT (UPDATED TO SAVE COLLEGE/BRANCH/YEAR)
exports.registerForEvent = async (req, res) => {
  try {
    const userId = req.user?._id;
    const eventId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "User not found in token" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const existing = await Registration.findOne({ user: userId, event: eventId });
    if (existing)
      return res.status(400).json({ message: "Already registered" });

    // ⭐ FRONTEND sends registrationDetails: {}
    const details = req.body.registrationDetails || req.body || {};

    const college = details.college || "";
    const department = details.department || "";
    const yearOfStudy = details.yearOfStudy || "";

    const registration = await Registration.create({
      user: userId,
      event: eventId,
      college,
      department,
      yearOfStudy,
      status: "pending",
      timestamp: new Date()
    });

    return res.json({
      message: "Registered successfully!",
      registration
    });
  } catch (err) {
    console.error("Register Event Error:", err);
    return res.status(500).json({ message: "Server error during registration" });
  }
};

// CANCEL REGISTRATION
exports.cancelRegistration = async (req, res) => {
  try {
    const removed = await Registration.findOneAndDelete({
      event: req.params.id,
      user: req.user._id
    });

    res.json({ message: "Registration cancelled", removed });
  } catch (err) {
    console.error("cancelRegistration error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
