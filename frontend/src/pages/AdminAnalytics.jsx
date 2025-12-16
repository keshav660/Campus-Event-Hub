// src/pages/AdminAnalytics.jsx
import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import "./AdminAnalytics.css";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

const COLORS = ["#ef4444", "#f97316", "#f59e0b", "#facc15", "#10b981"];

function fmtNumber(n) {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString();
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Robust fetch that supports either { success: true, data: {...} } or raw object
  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/stats", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to load analytics");

      const json = await res.json();
      // backend might return { success: true, data: {...} } or return stats object directly
      const payload = json && json.data ? json.data : json;
      setStats(payload);
    } catch (err) {
      setError(err.message || "Error loading analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-analytics-page">
          <div className="loader">Loading analytics…</div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !stats) {
    return (
      <AdminLayout>
        <div className="admin-analytics-page">
          <div className="notice">{error || "Failed to load stats"}</div>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => setRefreshKey((k) => k + 1)}>Retry</button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ⭐ Prepare rating distribution
  const ratingDistData = [1, 2, 3, 4, 5].map((star, idx) => ({
    star: `${star} Star`,
    count:
      // support stats.distribution keyed by number or string
      (stats.distribution && (stats.distribution[star] ?? stats.distribution[star + ""])) ||
      (stats.distribution && stats.distribution[star]) ||
      0,
    fill: COLORS[idx],
  }));

  // ⭐ Prepare pie chart data
  const ratingPieData = ratingDistData.map((d) => ({
    name: d.star,
    value: d.count,
    fill: d.fill,
  }));

  // ⭐ Prepare engagement timeline
  const engagementSeries = (stats.engagement || []).map((e) => ({
    date: e.date,
    count: e.count,
  }));

  const topEvents = stats.topEvents || [];
  const topStudents = stats.topStudents || [];

  // ---------- NEW: derive recent feedback comments ----------
  // Backend might return:
  // - stats.recentFeedbacks: [{ eventName, userName, comment, rating, createdAt }]
  // - OR comments nested inside topEvents: topEvents[].comments = [{ user, comment, rating, createdAt }]
  // We'll create a unified list `recentFeedbacks` for display.

  // IMPORTANT CHANGE: **Do NOT re-merge topEvents comments** here.
  // The backend already filters feedback based on event.updatedAt.
  // So use only stats.recentFeedbacks to avoid reintroducing old feedback.
  const unifiedRecentFeedbacks = (stats.recentFeedbacks || []).map((r) => ({
    eventName: r.eventName || r.event || r.eventTitle || "Unknown Event",
    comment: r.comment || r.text || "",
    rating: r.rating ?? null,
    user: r.userName || r.user || r.userId || null,
    createdAt: r.createdAt || r.date || null,
  }));

  return (
    <AdminLayout>
      <div className="admin-analytics-page">
        <header className="analytics-header">
          <h1>Admin Analytics</h1>
          <p className="muted">Event Performance & Student Engagement</p>
          {/* NOTE: Refresh button moved into Recent Feedback card per request */}
        </header>

        {/* ───── KPIs ───── */}
        <section className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-title">Total Feedback</div>
            <div className="kpi-value">{fmtNumber(stats.totalFeedbacks)}</div>
            <div className="kpi-note">Based on submitted feedback</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-title">Average Rating</div>
            <div className="kpi-value">{stats.averageRating || 0} / 5.0</div>
            <div className="kpi-note">Calculated from all events</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-title">Total Events</div>
            <div className="kpi-value">{fmtNumber(stats.totalEvents)}</div>
            <div className="kpi-note">All created events</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-title">Total Registrations</div>
            <div className="kpi-value">{fmtNumber(stats.totalRegistrations)}</div>
            <div className="kpi-note">Student registrations</div>
          </div>
        </section>

        {/* ───── Rating Distribution & Pie Chart ───── */}
        <section className="charts-row">
          {/* Bar Chart */}
          <div className="chart-card">
            <div className="card-head">
              <h3>Rating Distribution</h3>
              <div className="muted">Number of ratings per star</div>
            </div>

            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={ratingDistData}>
                <XAxis dataKey="star" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count">
                  {ratingDistData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="chart-card">
            <div className="card-head">
              <h3>Rating Breakdown</h3>
              <div className="muted">Percentage split</div>
            </div>

            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={ratingPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => (entry.value > 0 ? entry.value : "")}
                >
                  {ratingPieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ───── Engagement Over Time ───── */}
        <section className="charts-row">
          <div className="chart-card large">
            <div className="card-head">
              <h3>Engagement Over Time</h3>
              <div className="muted">Daily feedback submission trend</div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={engagementSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#0B8FCE"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Events - ADDED top-events-card class */}
          {/* If you prefer the card to push layout (not just visually shift), add "force-layout-move" */}
          {/* Example: <div className="table-card top-events-card force-layout-move"> */}
          <div className="table-card top-events-card">
            <div className="card-head">
              <h3>Top Events</h3>
              <div className="muted">Most feedback received</div>
            </div>

            <div className="table-wrap top-events-body">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Feedbacks</th>
                    <th>Avg Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {topEvents.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="muted">
                        No feedback available
                      </td>
                    </tr>
                  ) : (
                    topEvents.map((ev) => (
                      <tr key={ev.id || ev._id || ev.eventId}>
                        <td>{ev.name || ev.title || ev.eventName}</td>
                        <td>{ev.count ?? ev.feedbackCount ?? "-"}</td>
                        <td>{ev.avg ?? ev.averageRating ?? "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ───── Recent Feedback (NEW) ───── */}
        <section style={{ marginTop: 24 }}>
          <div className="table-card full recent-feedback-card">
            <div
              className="card-head"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3>Recent Feedback</h3>
                <div className="muted">Latest comments submitted by students</div>
              </div>

              {/* BLACK REFRESH BUTTON (positioned top-right of Recent Feedback card) */}
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                style={{
                  padding: "8px 30px",
                  borderRadius: 6,
                  border: "none",
                  background: "black",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Refresh
              </button>
            </div>

            <div className="table-wrap recent-feedback-body">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Student</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {unifiedRecentFeedbacks.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="muted">
                        No comments available
                      </td>
                    </tr>
                  ) : (
                    unifiedRecentFeedbacks.map((r, idx) => (
                      <tr key={idx}>
                        <td style={{ maxWidth: 180 }}>{r.eventName}</td>
                        <td>{r.user || "Unknown"}</td>
                        <td>{r.rating ?? "-"}</td>
                        <td style={{ maxWidth: 500, whiteSpace: "normal" }}>{r.comment}</td>
                        <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ───── Top Students ───── */}
        <section className="charts-row">
          <div className="table-card full">
            <div className="card-head">
              <h3>Top Students</h3>
              <div className="muted">Most active feedback submitters</div>
            </div>

            <div className="table-wrap top-students-body">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Feedback Count</th>
                  </tr>
                </thead>
                <tbody>
                  {topStudents.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="muted">
                        No activity found
                      </td>
                    </tr>
                  ) : (
                    topStudents.map((s) => (
                      <tr key={s.id || s._id || s.name}>
                        <td>{s.name}</td>
                        <td>{s.count ?? s.feedbackCount ?? "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <footer className="analytics-footer muted">Data powered by backend analytics.</footer>
      </div>
    </AdminLayout>
  );
}
