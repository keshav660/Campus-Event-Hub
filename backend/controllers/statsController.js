// controllers/statsController.js
// Corrected: use event OCCURRENCE date (not updatedAt) for feedback visibility
// Returns aggregated admin statistics including recentFeedbacks.

const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Feedback = require("../models/Feedback");
const User = require("../models/User");

/**
 * parseEventDate(event)
 * Tries many common fields and formats, returns a Date or null.
 * NOTE: intentionally does NOT use event.updatedAt here — we want the actual event occurrence date.
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

    if (raw instanceof Date && !isNaN(raw.getTime())) return raw;

    const rawStr = String(raw).trim();

    // numeric timestamp (ms or seconds)
    if (/^\d+$/.test(rawStr)) {
      const n = Number(rawStr);
      const tryMs = new Date(n);
      if (!isNaN(tryMs.getTime())) return tryMs;
      const trySec = new Date(n * 1000);
      if (!isNaN(trySec.getTime())) return trySec;
    }

    // direct Date parse (ISO etc)
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
 * Determines whether a feedback should be considered visible for analytics
 * based on the event occurrence date (parsed from event fields) and feedback createdAt.
 *
 * Visibility rule:
 *  - If the event occurrence date is known: keep feedbacks with createdAt >= eventOccurrenceDate
 *  - Otherwise: keep feedback (backwards-compatible)
 */
function isFeedbackVisibleForEvent(fb) {
  if (!fb || !fb.event) return false;

  const ev = fb.event;
  const eventOccurDate = parseEventDate(ev); // parseEventDate does NOT use updatedAt

  if (eventOccurDate && fb.createdAt) {
    try {
      return new Date(fb.createdAt).getTime() >= new Date(eventOccurDate).getTime();
    } catch (err) {
      // parsing failure — be conservative and discard
      return false;
    }
  }

  // no event occurrence date to compare — keep by default
  return true;
}

/**
 * GET /api/stats/admin
 * Returns aggregated admin statistics including recentFeedbacks in the shape AdminAnalytics.jsx expects.
 */
exports.getAdminStats = async (req, res) => {
  try {
    // Load base event info for name mapping
    const events = await Event.find().select("name title startDate date").lean();
    const eventMap = {};
    events.forEach((ev) => {
      const id = String(ev._id);
      eventMap[id] = {
        name: ev.name || ev.title || "Unknown Event",
        raw: ev,
        parsedDate: parseEventDate(ev),
      };
    });

    // Load all feedbacks with non-empty comments and populate user + event
    const allFeedbacks = await Feedback.find({ comment: { $exists: true, $ne: "" } })
      .populate("user", "name email")
      .populate("event", "name title startDate date")
      .lean();

    // Filter visible feedbacks using unified rule (occurrence date)
    const visibleFeedbacks = allFeedbacks.filter((fb) => {
      if (!fb || !fb.event) return false;
      return isFeedbackVisibleForEvent(fb);
    });

    // ---------- Event & registration counts ----------
    const totalEvents = await Event.countDocuments();
    const approvedEvents = await Event.countDocuments({ status: "approved" });
    const pendingEvents = await Event.countDocuments({ status: "pending" });
    const rejectedEvents = await Event.countDocuments({ status: "rejected" });

    const totalRegistrations = await Registration.countDocuments();
    const pendingRegistrations = await Registration.countDocuments({ status: "pending" });
    const approvedRegistrations = await Registration.countDocuments({ status: "approved" });

    // ---------- Feedback metrics based on visible feedbacks ----------
    const totalFeedbacks = visibleFeedbacks.length;

    const ratingNumbers = visibleFeedbacks
      .map((f) => (typeof f.rating === "number" ? f.rating : (f.rating ? Number(f.rating) : null)))
      .filter((r) => r !== null && !Number.isNaN(r));

    const averageRating =
      ratingNumbers.length > 0
        ? Number((ratingNumbers.reduce((s, v) => s + v, 0) / ratingNumbers.length).toFixed(2))
        : 0;

    const distributionMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingNumbers.forEach((r) => {
      if (r >= 1 && r <= 5) distributionMap[r] = (distributionMap[r] || 0) + 1;
    });

    // Engagement trend (group by day) from visible feedbacks
    const engagementMap = {};
    visibleFeedbacks.forEach((f) => {
      if (f.createdAt) {
        const key = new Date(f.createdAt).toISOString().split("T")[0]; // YYYY-MM-DD
        engagementMap[key] = (engagementMap[key] || 0) + 1;
      }
    });
    const engagement = Object.keys(engagementMap)
      .sort()
      .map((k) => ({ date: k, count: engagementMap[k] }));

    // Top events by visible feedback count + average rating
    const byEvent = {};
    visibleFeedbacks.forEach((f) => {
      const ev = f.event;
      if (!ev || !ev._id) return;
      const id = String(ev._id);
      byEvent[id] =
        byEvent[id] ||
        {
          eventId: id,
          count: 0,
          ratings: [],
          name: eventMap[id]?.name || (ev.title || ev.name) || "Unknown Event",
        };
      byEvent[id].count += 1;
      if (typeof f.rating === "number") byEvent[id].ratings.push(f.rating);
      else if (f.rating) {
        const nr = Number(f.rating);
        if (!Number.isNaN(nr)) byEvent[id].ratings.push(nr);
      }
    });
    const topEvents = Object.values(byEvent)
      .map((x) => ({
        id: x.eventId,
        name: x.name,
        count: x.count,
        avg: x.ratings.length ? Number((x.ratings.reduce((s, v) => s + v, 0) / x.ratings.length).toFixed(2)) : null,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top students by visible feedback count
    const byUser = {};
    visibleFeedbacks.forEach((f) => {
      const u = f.user;
      const uid = u ? String(u._id) : (f.user ? String(f.user) : null);
      if (!uid) return;
      byUser[uid] = byUser[uid] || { userId: uid, count: 0, name: (u && (u.name || u.email)) || "Unknown Student" };
      byUser[uid].count += 1;
    });
    const topStudents = Object.values(byUser)
      .map((x) => ({ id: x.userId, name: x.name, count: x.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent feedbacks: latest 20 from visibleFeedbacks
    const recentFeedbacks = visibleFeedbacks
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20)
      .map((f) => ({
        _id: f._id,
        rating: f.rating,
        comment: f.comment,
        createdAt: f.createdAt,
        userName: (f.user && (f.user.name || f.user.email)) || "Unknown",
        eventName: (f.event && (f.event.title || f.event.name)) || "Unknown Event",
      }));

    // Return consolidated stats (shape matches AdminAnalytics.jsx expectation)
    return res.json({
      // event stats
      totalEvents,
      approvedEvents,
      pendingEvents,
      rejectedEvents,

      // registration stats
      totalRegistrations,
      pendingRegistrations,
      approvedRegistrations,

      // feedback stats
      totalFeedbacks,
      averageRating,
      distribution: distributionMap,
      engagement,

      // top lists
      topEvents,
      topStudents,

      // recent comments
      recentFeedbacks,
    });
  } catch (err) {
    console.error("Stats load error:", err);
    return res.status(500).json({ message: "Stats load error" });
  }
};
