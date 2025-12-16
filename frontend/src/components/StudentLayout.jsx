

import React, { useState, useEffect } from "react";
import {
  FaBell,
  FaEnvelope,
  FaSignOutAlt,
  FaCalendarAlt,
  FaClipboardList,
  FaHistory,
  FaTachometerAlt,
  FaCalendarCheck,
  FaChartBar,
  FaUsers,
  FaCog,
  FaCamera,
  FaTimesCircle,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./StudentLayout.css";

const StudentLayout = ({ children }) => {
  const [studentProfile, setStudentProfile] = useState({
    photo: "",
    college: "",
    name: "Student User",
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mountedOnce, setMountedOnce] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Render stabilization
  useEffect(() => {
    setMountedOnce(true);
  }, []);

  // Load backend user & saved profile
  useEffect(() => {
    if (!mountedOnce) return;

    const backendUser = JSON.parse(localStorage.getItem("loggedInStudent"));
    const savedProfile = JSON.parse(localStorage.getItem("studentProfile"));

    setStudentProfile((prev) => ({
      ...prev,
      name: backendUser?.name || prev.name,
      photo: savedProfile?.photo || prev.photo,
      college: savedProfile?.college || prev.college,
    }));

    window.scrollTo(0, 0);
  }, [mountedOnce, location.pathname]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("loggedInStudent");
    localStorage.removeItem("studentProfile");
    localStorage.removeItem("user");

    toast.info("Logged out successfully!", {
      position: "top-center",
      autoClose: 2000,
    });

    setShowLogoutModal(false);
    setTimeout(() => navigate("/login"), 1200);
  };

  // Profile Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const updated = { ...studentProfile, photo: reader.result };
      setStudentProfile(updated);
      localStorage.setItem("studentProfile", JSON.stringify(updated));

      toast.success("📸 Profile photo updated!", {
        position: "top-center",
        autoClose: 2000,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    const updated = { ...studentProfile, photo: "" };
    setStudentProfile(updated);
    localStorage.setItem("studentProfile", JSON.stringify(updated));
    toast.info("Profile photo removed!", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  const handleSaveDetails = () => {
    localStorage.setItem("studentProfile", JSON.stringify(studentProfile));
    setShowProfileModal(false);
    toast.success("Profile details saved!", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  // Navigate to My Registrations
  const goToRegisteredEvents = () => {
    navigate("/student/my-registrations");
  };

  // Navigate to Past Events
  const goToPastEvents = () => {
    navigate("/student/past-events");
  };

  // Navigate to Community
  const goToCommunity = () => {
    navigate("/student/community");
  };

  // // Navigate to Settings
  // const goToSettings = () => {
  //   navigate("/student/settings");
  // };

  // Sidebar highlight logic
  const isActive = (pathCheck) => location.pathname.includes(pathCheck);

  const defaultAvatar = "https://via.placeholder.com/40?text=S";

  if (!mountedOnce) return <div style={{ visibility: "hidden" }} />;

  return (
    <div className="student-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2 className="logo">CampusEventHub</h2>
        <ul className="menu">
          {/* Dashboard */}
          <li
            className={isActive("/student/dashboard") ? "active" : ""}
            onClick={() => navigate("/student/dashboard")}
          >
            <FaTachometerAlt /> <span>Dashboard</span>
          </li>

          {/* All Events */}
          <li
            className={isActive("/student/all/events") ? "active" : ""}
            onClick={() => navigate("/student/all/events")}
          >
            <FaCalendarCheck /> <span>Events</span>
          </li>

          {/* My Registrations */}
          <li
            className={isActive("/student/my-registrations") ? "active" : ""}
            onClick={goToRegisteredEvents}
          >
            <FaClipboardList /> <span>My Registrations</span>
          </li>

          {/* Past Events */}
          <li
            className={isActive("/student/past-events") ? "active" : ""}
            onClick={goToPastEvents}
          >
            <FaHistory /> <span>Past Events</span>
          </li>

          {/* Community */}
          {/* <li
            className={isActive("/student/community") ? "active" : ""}
            onClick={goToCommunity}
          >
            <FaUsers /> <span>Community</span>
          </li> */}  

        {/* Settings */}
          {/* <li
            className={isActive("/student/settings") ? "active" : ""}
            onClick={goToSettings}
          >
            <FaCog /> <span>Settings</span>
          </li> */}
        </ul>

        {/* LOGOUT */}
        <div className="logout" onClick={() => setShowLogoutModal(true)}>
          <FaSignOutAlt /> <span>Logout</span>
        </div>
      </aside>

      {/* MAIN SECTION */}
      <div className="main-section">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Student Dashboard</h1>
            <p>Explore, register, and track your campus events</p>
          </div>

          <div className="header-right">
            <FaBell className="icon" />
            <FaEnvelope className="icon" />

            <div
              className="student-profile"
              onClick={() => setShowProfileModal(true)}
            >
              <img
                src={studentProfile.photo || defaultAvatar}
                alt="Avatar"
                className="profile-img"
              />
              <div>
                <h4>{studentProfile.name}</h4>
                <p>{studentProfile.college || "Student"}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="content-area">{children}</div>
      </div>

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowProfileModal(false)}
        >
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <FaTimesCircle
              className="close-icon"
              onClick={() => setShowProfileModal(false)}
            />
            <h3>Update Profile</h3>

            <div className="upload-section">
              <label htmlFor="photo-upload">
                {studentProfile.photo ? (
                  <img
                    src={studentProfile.photo}
                    alt="Preview"
                    className="preview-img"
                  />
                ) : (
                  <>
                    <FaCamera size={30} />
                    <p>Upload Profile Photo</p>
                  </>
                )}
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </label>

              {studentProfile.photo && (
                <button className="remove-photo" onClick={handleRemovePhoto}>
                  Remove Photo
                </button>
              )}
            </div>

            <div className="college-input">
              <input
                type="text"
                placeholder="Enter College Name"
                value={studentProfile.college}
                onChange={(e) =>
                  setStudentProfile({
                    ...studentProfile,
                    college: e.target.value,
                  })
                }
              />
            </div>

            <button className="save-btn" onClick={handleSaveDetails}>
              Save Details
            </button>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowLogoutModal(false)}
        >
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <p>Are you sure you want to log out?</p>
            <div className="logout-buttons">
              <button onClick={handleLogout}>Yes</button>
              <button onClick={() => setShowLogoutModal(false)}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLayout;
