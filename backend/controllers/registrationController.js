const Registration = require("../models/Registration");
const User = require("../models/User");
const Event = require("../models/Event");


// GET ALL REGISTRATIONS (Admin)
exports.getAllRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate("user", "name email college department yearOfStudy")
      .populate("event", "name date college");

    return res.json({ registrations });
  } catch (err) {
    console.error("Get registrations error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// APPROVE REGISTRATION (Admin)
exports.approveRegistration = async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id);

    if (!reg)
      return res.status(404).json({ message: "Registration not found" });

    reg.status = "approved";
    await reg.save();

    return res.json({ message: "Registration approved", reg });
  } catch (err) {
    console.error("Approve error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// REJECT REGISTRATION (Admin)
exports.rejectRegistration = async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id);

    if (!reg)
      return res.status(404).json({ message: "Registration not found" });

    reg.status = "rejected";
    await reg.save();

    return res.json({ message: "Registration rejected", reg });
  } catch (err) {
    console.error("Reject error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// DELETE REGISTRATION (Owner OR Admin OR Event Organizer)
exports.deleteRegistration = async (req, res) => {
  try {
    console.log("=== DELETE_REGISTRATION called ===");
    console.log("Request params id:", req.params.id);
    console.log("req.user (from token):", req.user);

    // 1. Find registration and populate event
    const reg = await Registration.findById(req.params.id).populate({
      path: "event",
      select: "name createdBy organizer owner", // common possible fields
    });

    if (!reg) {
      console.log("Registration not found:", req.params.id);
      return res.status(404).json({ message: "Registration not found" });
    }

    console.log("Found registration:", {
      id: reg._id.toString(),
      user: reg.user.toString(),
      status: reg.status,
      eventId: reg.event ? reg.event._id.toString() : null,
      eventObj: reg.event ? { name: reg.event.name } : null,
    });

    // 2. Permission check
    const requesterId = req.user._id.toString();
    const ownerId = reg.user.toString();
    const role = (req.user.role || "").toLowerCase();

    // Find event owner/organizer id (try multiple common field names)
    let eventOwnerId = null;
    if (reg.event) {
      // check for common fields
      const possible = ["organizer", "createdBy", "created_by", "owner", "user", "creator"];
      for (const key of possible) {
        if (reg.event[key]) {
          try {
            eventOwnerId = reg.event[key].toString();
            break;
          } catch (e) {
            // ignore casting errors
          }
        }
      }
      // also if event has a populated _id only, eventOwnerId may stay null
    }

    console.log("Comparing requesterId:", requesterId, "ownerId:", ownerId, "role:", role, "eventOwnerId:", eventOwnerId);

    // permission allowed if:
    // - requester is registration owner
    // - OR requester role is admin
    // - OR requester is the event owner/organizer
    const isOwner = requesterId === ownerId;
    const isAdmin = role === "admin";
    const isEventOwner = eventOwnerId && requesterId === eventOwnerId;

    if (!isOwner && !isAdmin && !isEventOwner) {
      console.log("❌ Permission denied: not owner, not admin, not event organizer");
      return res.status(403).json({ message: "Access denied: insufficient permissions" });
    }

    // 3. Authorized — delete registration
    await reg.deleteOne();
    console.log("✔ Registration deleted:", reg._id.toString());

    return res.json({ message: "Registration deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
