// src/pages/ManageStudents.jsx
import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";
import AdminLayout from "../components/AdminLayout";
import "./ManageStudents.css";

const API = "http://localhost:5000/api";

const ManageStudents = () => {
  const [registrations, setRegistrations] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Delete confirmation modal state
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    id: null,
    name: "",
    eventName: "",
  });

  const token = localStorage.getItem("token");

  // Load registrations
  const loadRegistrations = async () => {
    try {
      const res = await fetch(`${API}/registrations`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setRegistrations(data.registrations || []);
    } catch (err) {
      toast.error("Failed to load registrations");
    }
  };

  useEffect(() => {
    loadRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Approve
  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API}/registrations/${id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Approve failed");

      toast.success("Approved!");
      await loadRegistrations();
    } catch (err) {
      toast.error(err.message || "Error approving registration");
    }
  };

  // Reject
  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API}/registrations/${id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reject failed");

      toast.info("Rejected!");
      await loadRegistrations();
    } catch (err) {
      toast.error(err.message || "Error rejecting registration");
    }
  };

  // Open delete confirmation modal
  const openDeleteConfirm = (reg) => {
    setConfirmDelete({
      show: true,
      id: reg._id,
      name: reg.user?.name || reg.fullName || "Student",
      eventName: reg.event?.name || "Event",
    });
  };

  // Handle confirmed delete
  const handleDeleteConfirmed = async () => {
    const { id } = confirmDelete;

    try {
      const res = await fetch(`${API}/registrations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");

      toast.success("Registration deleted!");
      setConfirmDelete({ show: false, id: null, name: "", eventName: "" });
      await loadRegistrations();
    } catch (err) {
      toast.error(err.message || "Error deleting registration");
    }
  };

  // Close modal
  const closeDeleteConfirm = () => {
    setConfirmDelete({ show: false, id: null, name: "", eventName: "" });
  };

  // Helper to safely read various user keys (college, department, year)
  const getUserField = (user = {}, keys = []) => {
    for (const k of keys) {
      if (user && typeof user[k] !== "undefined" && user[k] !== null && user[k] !== "") {
        return user[k];
      }
    }
    return null;
  };

  // Filtering & search
  const filteredRegistrations = registrations.filter((reg) => {
    const user = reg.user || {};
    const event = reg.event || {};
    const status = reg.status || "pending";

    const matchesStatus = filterStatus === "all" || filterStatus === status;

    const matchesSearch =
      searchTerm === "" ||
      (user.name || reg.fullName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (user.email || reg.email || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (event.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Stats
  const stats = {
    total: registrations.length,
    pending: registrations.filter((r) => (r.status || "pending") === "pending")
      .length,
    approved: registrations.filter((r) => r.status === "approved").length,
    rejected: registrations.filter((r) => r.status === "rejected").length,
  };

  return (
    <AdminLayout>
      <div className="manage-students-container">
        <div className="page-header">
          <h1>Manage Student Registrations</h1>
        </div>

        {/* Stats */}
        <section className="stats-grid">
          <div className="stat-card-mini total">
            <h3>{stats.total}</h3>
            <p>Total</p>
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

        {/* Search */}
        <section className="filters-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search student, email or event..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </section>

        {/* Table wrapper with scroll */}
        <section className="registrations-section">
          <div
            className="registrations-table-wrapper professional"
            /* inline style can be used for quick testing; remove if not needed */
            // style={{ maxHeight: "520px", overflowY: "auto", overflowX: "auto" }}
          >
            <table
              className="registrations-table professional"
              role="table"
              aria-label="Registrations table"
            >
              <thead>
                <tr>
                  <th className="col-name">Name</th>
                  <th className="col-email">Email</th>
                  <th className="col-college">College</th>
                  <th className="col-dept">Department / Branch</th>
                  <th className="col-year">Year</th>
                  <th className="col-event">Event</th>
                  <th className="col-date">Date</th>
                  <th className="col-status">Status</th>
                  <th className="col-action">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                      No registrations found.
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg) => {
                    const status = reg.status || "pending";
                    const user = reg.user || {};

                    // Prefer snapshot fields stored in registration; fallback to user fields
                    const college =
                      reg.college ||
                      getUserField(user, ["college", "collegeName", "institution"]) ||
                      "N/A";

                    const department =
                      reg.department ||
                      getUserField(user, ["department", "branch", "dept"]) ||
                      "N/A";

                    const year =
                      reg.yearOfStudy ||
                      getUserField(user, ["yearOfStudy", "year", "studyYear"]) ||
                      "N/A";

                    const name = (user && (user.name || user.fullName)) || reg.fullName || "N/A";
                    const email = (user && user.email) || reg.email || "N/A";

                    // Debug: uncomment to inspect exact payload coming from backend
                    // console.debug("REG ROW:", reg);

                    return (
                      <tr key={reg._id}>
                        <td className="td-name">
                          <div className="td-primary">{name}</div>
                        </td>

                        <td className="td-email">
                          <div className="td-primary">{email}</div>
                        </td>

                        <td className="td-college">
                          <div className="td-primary">{college}</div>
                        </td>

                        <td className="td-dept">
                          <div className="td-primary">{department}</div>
                        </td>

                        <td className="td-year">
                          <div className="td-primary">{year}</div>
                        </td>

                        <td className="td-event">{reg.event?.name || "N/A"}</td>

                        <td className="td-date">
                          {reg.event?.date ? String(reg.event.date).split("T")[0] : "N/A"}
                        </td>

                        <td className={`status-badge ${status}`}>{status.toUpperCase()}</td>

                        <td className="action-buttons">
                          {/* Approve / Reject */}
                          {status === "pending" && (
                            <>
                              <button
                                className="approve-btn"
                                onClick={() => handleApprove(reg._id)}
                                title="Approve"
                              >
                                ✅
                              </button>
                              <button
                                className="reject-btn"
                                onClick={() => handleReject(reg._id)}
                                title="Reject"
                              >
                                ❌
                              </button>
                            </>
                          )}

                          {/* DELETE BUTTON → Opens Modal */}
                          <button
                            className="delete-btn-small"
                            onClick={() => openDeleteConfirm(reg)}
                            title="Delete registration"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Short confirmation modal with black buttons */}
      {confirmDelete.show && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3>Delete Registration</h3>
            <p>
              Do you want to delete the registration for <strong>{confirmDelete.name}</strong> in{" "}
              <strong>{confirmDelete.eventName}</strong>?
            </p>

            <div className="confirm-actions">
              <button className="btn-black" onClick={handleDeleteConfirmed}>
                Yes
              </button>

              <button className="btn-black" onClick={closeDeleteConfirm}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageStudents;
