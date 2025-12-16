import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import AdminAnalytics from "./pages/AdminAnalytics";

/* =====================================
   🔹 Lazy Load Pages (Better Performance)
===================================== */
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const OtpVerification = lazy(() => import("./pages/OtpVerification"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

/* -------- 🧑‍💼 Admin Pages -------- */
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminEvents = lazy(() => import("./pages/AdminEvents"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));
const ManageStudents = lazy(() => import("./pages/ManageStudents"));

/* -------- 🎓 Student Pages -------- */
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const AllEvents = lazy(() => import("./pages/AllEvents"));
const MyRegistrations = lazy(() => import("./pages/MyRegistrations"));
const PastEvents = lazy(() => import("./pages/PastEvents")); // 🆕

/* -------- 🎟 Event Details -------- */
const EventDetails = lazy(() => import("./pages/EventDetails"));

/* =====================================
   🔹 Loader (Fallback for Lazy Loading)
===================================== */
const Loader = () => (
  <div
    style={{
      textAlign: "center",
      paddingTop: "120px",
      fontSize: "1.2rem",
      color: "#555",
      fontFamily: "Poppins, sans-serif",
      letterSpacing: "0.5px",
    }}
  >
    Loading, please wait...
  </div>
);

/* =====================================
   🔹 Main App Component
===================================== */
function App() {
  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <Routes>

          {/* -------- 🌐 Public Routes -------- */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/otp" element={<OtpVerification />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* -------- 🧑‍💼 Admin Dashboard Routes -------- */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/events" element={<AdminEvents />} />

          {/* 🟢 CREATE EVENT (NEW EVENT) */}
          <Route path="/admin/create-event" element={<CreateEvent />} />

          {/* 🟢 EDIT EVENT (IMPORTANT — THIS FIXES YOUR ERROR) */}
          <Route path="/admin/create-event/:id" element={<CreateEvent />} />

          <Route path="/admin/students" element={<ManageStudents />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />

          {/* -------- 🎓 Student Dashboard Routes -------- */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/all/events" element={<AllEvents />} />
          <Route path="/student/my-registrations" element={<MyRegistrations />} />
          <Route path="/student/past-events" element={<PastEvents />} />

          {/* -------- 🎟 Shared Event Details -------- */}
          <Route path="/event/:id" element={<EventDetails />} />

        </Routes>
      </Suspense>

      {/* 🌟 Global Toast Notifications */}
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        limit={3}
        theme="light"
        toastClassName="custom-toast"
        progressClassName="custom-toast-progress"
      />
    </Router>
  );
}

export default App;
