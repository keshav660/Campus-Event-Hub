import React, { useState, useEffect } from "react";
import {
  FaCalendarCheck,
  FaUserGraduate,
  FaChartBar,
  FaCog,
  FaTachometerAlt,
  FaSignOutAlt,
  FaBell,
  FaEnvelope,
  FaTimesCircle,
  FaCamera,
  FaUniversity,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "./AdminLayout.css";

const AdminLayout = ({ children }) => {
  // safe inline avatar fallback (no external network)
  const SAFE_AVATAR =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>
         <rect width='100%' height='100%' rx='6' fill='#e5e7eb'/>
         <text x='50%' y='50%' font-size='16' text-anchor='middle'
           fill='#6b7280' dominant-baseline='middle'>A</text>
       </svg>`
    );

  const [adminProfile, setAdminProfile] = useState({
    photo: "",
    college: "",
    name: "Admin User",
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // ============================================
  // LOAD ADMIN NAME + PROFILE DATA
  // ============================================
  useEffect(() => {
    let savedProfile = null;
    let loggedUser = null;

    try {
      savedProfile = JSON.parse(localStorage.getItem("adminProfile"));
    } catch (e) {
      savedProfile = null;
    }

    try {
      loggedUser = JSON.parse(localStorage.getItem("user"));
    } catch (e) {
      loggedUser = null;
    }

    setAdminProfile((prev) => ({
      ...prev,
      name: loggedUser?.name || prev.name,
      photo: savedProfile?.photo || prev.photo,
      college: savedProfile?.college || prev.college,
    }));
  }, [location.pathname]);

  // ============================================
  // SAVE PROFILE DETAILS
  // ============================================
  const handleSaveProfile = () => {
    localStorage.setItem("adminProfile", JSON.stringify(adminProfile));
    setShowProfileModal(false);
    toast.success("Profile details saved!", { position: "top-center", autoClose: 2000 });
  };

  // ============================================
  // HANDLE PHOTO UPLOAD
  // ============================================
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const updated = { ...adminProfile, photo: reader.result };
        setAdminProfile(updated);
        toast.success("Profile photo updated!", { position: "top-center", autoClose: 2000 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAdminProfile({ ...adminProfile, photo: "" });
    toast.info("Profile photo removed", { position: "top-center", autoClose: 2000 });
  };

  // ============================================
  // LOGOUT
  // ============================================
  const handleLogout = () => {
    localStorage.clear();
    toast.info("Logged out successfully!", { position: "top-center", autoClose: 2000 });
    setShowLogoutModal(false);
    setTimeout(() => navigate("/login"), 1200);
  };

  // ============================================
  // Dynamic Page Title
  // ============================================
  const getPageTitle = () => {
    if (location.pathname.includes("/admin/events")) return "Manage Events";
    if (location.pathname.includes("/admin/dashboard")) return "Admin Dashboard";
    if (location.pathname.includes("/admin/students")) return "Manage Students";
    if (location.pathname.includes("/admin/analytics")) return "Analytics Overview";
    return "Admin Dashboard";
  };

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2 className="logo">CampusEventHub</h2>
        <ul className="menu">
          <li
            className={location.pathname.includes("/admin/dashboard") ? "active" : ""}
            onClick={() => navigate("/admin/dashboard")}
          >
            <FaTachometerAlt /> <span>Dashboard</span>
          </li>

          <li
            className={location.pathname.includes("/admin/events") ? "active" : ""}
            onClick={() => navigate("/admin/events")}
          >
            <FaCalendarCheck /> <span>Events</span>
          </li>

          <li
            className={location.pathname.includes("/admin/students") ? "active" : ""}
            onClick={() => navigate("/admin/students")}
          >
            <FaUserGraduate /> <span>Students</span>
          </li>

          <li
            className={location.pathname.includes("/admin/analytics") ? "active" : ""}
            onClick={() => navigate("/admin/analytics")}
          >
            <FaChartBar /> <span>Analytics</span>
          </li>
        </ul>

        <div className="logout" onClick={() => setShowLogoutModal(true)}>
          <FaSignOutAlt /> <span>Logout</span>
        </div>
      </aside>

      {/* MAIN SECTION */}
      <div className="main-section">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1>{getPageTitle()}</h1>
            <p>Manage Events, Track Registrations & Approvals</p>
          </div>

          <div className="header-right">
            <FaBell className="icon" title="Notifications" />
            <FaEnvelope className="icon" title="Messages" />

            <div
              className="admin-profile"
              onClick={() => setShowProfileModal(true)}
              title="Edit Profile"
            >
              <img
                src={adminProfile.photo || SAFE_AVATAR}
                alt="Admin Avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = SAFE_AVATAR;
                }}
                className="profile-img"
              />
              <div>
                <h4>{adminProfile.name}</h4>
                <p>{adminProfile.college || "Administrator"}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="content-area">{children}</div>
      </div>

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <FaTimesCircle className="close-icon" onClick={() => setShowProfileModal(false)} />
            <h3>Update Profile</h3>

            <div className="upload-section">
              <label htmlFor="photo-upload">
                {adminProfile.photo ? (
                  <img src={adminProfile.photo} alt="Profile Preview" className="preview-img" />
                ) : (
                  <>
                    <FaCamera size={30} />
                    <p>Upload Profile Photo</p>
                  </>
                )}
                <input type="file" id="photo-upload" accept="image/*" onChange={handlePhotoUpload} />
              </label>

              {adminProfile.photo && (
                <button className="remove-photo" onClick={handleRemovePhoto}>
                  Remove Photo
                </button>
              )}
            </div>

            <div className="college-input">
              <FaUniversity className="input-icon" />
              <input
                type="text"
                placeholder="Enter College Name"
                value={adminProfile.college}
                onChange={(e) => setAdminProfile({ ...adminProfile, college: e.target.value })}
              />
            </div>

            <button className="save-btn" onClick={handleSaveProfile}>
              Save Details
            </button>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <p>Are you sure you want to log out?</p>
            <div className="logout-buttons">
              <button onClick={handleLogout} className="btn-yes">
                Yes
              </button>
              <button onClick={() => setShowLogoutModal(false)} className="btn-no">
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
