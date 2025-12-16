// controllers/feedbackController.js
// Full updated file — robust date parsing, returns populated feedback, recalculates stats.

const Feedback = require("../models/Feedback");
const Event = require("../models/Event");
const Registration = require("../models/Registration");

/**
 * parseEventDate(event)
 * Tries many common fields and formats, returns a Date or null.
 * Accepts Date objects, numeric timestamps (ms or s), ISO strings and YYYY-MM-DD.
 */
function parseEventDate(event) {
  if (!event || typeof event !== "object") return null;

  const candidates = [
    event.startDate,
    event.date,
    event.eventDate,
    event.beginDate,
    event.datetime,
    event.start,
    event.event_date,
    event.time,
  ];

  for (const raw of candidates) {
    if (!raw) continue;

    // Already a Date
    if (raw instanceof Date && !isNaN(raw.getTime())) return raw;

    const rawStr = String(raw).trim();

    // Numeric timestamp (ms or seconds)
    if (/^\d+$/.test(rawStr)) {
      const n = Number(rawStr);
      const tryMs = new Date(n);
      if (!isNaN(tryMs.getTime())) return tryMs;
      const trySec = new Date(n * 1000);
      if (!isNaN(trySec.getTime())) return trySec;
    }

    // Try Date constructor (ISO or other)
    const d = new Date(rawStr);
    if (!isNaN(d.getTime())) return d;

    // YYYY-MM-DD -> treat as end-of-day
    const m = rawStr.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
    if (m) {
      const y = Number(m[1]), mo = Number(m[2]) - 1, day = Number(m[3]);
      const endOfDay = new Date(y, mo, day, 23, 59, 59, 999);
      if (!isNaN(endOfDay.getTime())) return endOfDay;
    }

    // YYYY-MM-DD HH:mm or YYYY-MM-DDTHH:mm
    const m2 = rawStr.match(
      /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
    );
    if (m2) {
      const y = Number(m2[1]),
        mo = Number(m2[2]) - 1,
        day = Number(m2[3]),
        hh = m2[4] ? Number(m2[4]) : 23,
        mm = m2[5] ? Number(m2[5]) : 59,
        ss = m2[6] ? Number(m2[6]) : 59;
      const composed = new Date(y, mo, day, hh, mm, ss);
      if (!isNaN(composed.getTime())) return composed;
    }
  }

  return null;
}

/**
 * isEventInPast(event)
 * Returns true if event occurrence date (parsed) is strictly before now.
 */
function isEventInPast(event) {
  const d = parseEventDate(event);
  if (!d) {
    // no parsable date -> treat as not in past
    console.warn("feedbackController: event has no parsable date", event && event._id);
    return false;
  }
  return d.getTime() < Date.now();
}

/**
 * POST /api/feedback/:eventId
 * Create or update feedback for a given event by the authenticated user.
 * Response includes populated feedback and aggregated stats for that event.
 */
exports.createOrUpdateFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user && req.user._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    // Validate rating
    if (rating === undefined || rating === null) {
      return res.status(400).json({ message: "Rating is required." });
    }
    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5." });
    }

    // Fetch event
    const event = await Event.findById(eventId).lean();
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Ensure event is in the past
    if (!isEventInPast(event)) {
      const parsed = parseEventDate(event);
      const parsedStr = parsed ? parsed.toISOString() : null;
      console.warn("Feedback blocked: event not in past.", { eventId, parsedDate: parsedStr });
      return res.status(400).json({
        message: "You can only give feedback for past events.",
        eventParsedDate: parsedStr,
      });
    }

    // Check registration allowed statuses
    const allowedStatuses = ["approved", "attended", "present", "checked-in", "checked_in", "confirmed", "participated"];
    const registration = await Registration.findOne({
      event: eventId,
      user: userId,
      status: { $in: allowedStatuses },
    }).lean();

    if (!registration) {
      const anyReg = await Registration.findOne({ event: eventId, user: userId }).lean();
      console.warn("Feedback attempt rejected - registration missing or wrong status", {
        eventId,
        userId,
        foundRegistration: !!anyReg,
        registrationStatus: anyReg ? anyReg.status : null,
      });
      return res.status(403).json({
        message: "Only participants who attended this event can give feedback.",
        registrationFound: !!anyReg,
        registrationStatus: anyReg ? anyReg.status : null,
      });
    }

    // Create or update feedback
    let feedback = await Feedback.findOne({ event: eventId, user: userId });

    if (feedback) {
      feedback.rating = numericRating;
      feedback.comment = comment ?? feedback.comment;
      feedback.updatedAt = new Date();
      await feedback.save();
    } else {
      feedback = await Feedback.create({
        event: eventId,
        user: userId,
        rating: numericRating,
        comment,
      });
    }

    // Populate feedback for response (user + event minimal fields)
    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate("user", "name email")
      .populate("event", "title name date startDate")
      .lean();

    // Recalculate event-level feedback stats (aggregation)
    const agg = await Feedback.aggregate([
      { $match: { event: event._id } },
      {
        $group: {
          _id: "$event",
          averageRating: { $avg: "$rating" },
          totalFeedbacks: { $sum: 1 },
          rating1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          rating5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        },
      },
    ]);

    let resultStats = {
      averageRating: 0,
      totalFeedbacks: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    if (agg.length > 0) {
      const s = agg[0];
      resultStats = {
        averageRating: s.averageRating ? Number(s.averageRating.toFixed(2)) : 0,
        totalFeedbacks: s.totalFeedbacks || 0,
        distribution: {
          1: s.rating1 || 0,
          2: s.rating2 || 0,
          3: s.rating3 || 0,
          4: s.rating4 || 0,
          5: s.rating5 || 0,
        },
      };
    }

    return res.status(200).json({
      message: "Feedback saved successfully.",
      feedback: populatedFeedback,
      stats: resultStats,
    });
  } catch (error) {
    console.error("Error in createOrUpdateFeedback:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

/**
 * GET /api/feedback/:eventId
 * Get all feedback for an event + stats
 */
exports.getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).lean();
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const feedbacks = await Feedback.find({ event: eventId })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const statsAgg = await Feedback.aggregate([
      { $match: { event: event._id } },
      {
        $group: {
          _id: "$event",
          averageRating: { $avg: "$rating" },
          totalFeedbacks: { $sum: 1 },
          rating1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          rating5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        },
      },
    ]);

    let resultStats = {
      averageRating: 0,
      totalFeedbacks: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    if (statsAgg.length > 0) {
      const s = statsAgg[0];
      resultStats = {
        averageRating: s.averageRating ? Number(s.averageRating.toFixed(2)) : 0,
        totalFeedbacks: s.totalFeedbacks || 0,
        distribution: {
          1: s.rating1 || 0,
          2: s.rating2 || 0,
          3: s.rating3 || 0,
          4: s.rating4 || 0,
          5: s.rating5 || 0,
        },
      };
    }

    return res.status(200).json({
      feedbacks,
      stats: resultStats,
    });
  } catch (error) {
    console.error("Error in getEventFeedback:", error);
    return res.status(500).json({ message: "Server error." });
  }
};
