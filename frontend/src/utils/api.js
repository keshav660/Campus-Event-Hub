// // src/utils/api.js
// import axios from "axios";

// const API = axios.create({
//   baseURL: "http://localhost:5000/api", // correct
// });

// // Auto attach token
// API.interceptors.request.use((req) => {
//   const token = localStorage.getItem("token");
//   if (token) req.headers.Authorization = `Bearer ${token}`;
//   return req;
// });

// // POST Request
// export const postRequest = async (endpoint, data = {}) => {
//   try {
//     const res = await API.post(endpoint, data);
//     return res.data;
//   } catch (err) {
//     const msg =
//       err.response?.data?.message ||
//       err.message ||
//       "Server error";
//     throw new Error(msg);
//   }
// };

// // GET Request
// export const getRequest = async (endpoint) => {
//   try {
//     const res = await API.get(endpoint);
//     return res.data;
//   } catch (err) {
//     const msg =
//       err.response?.data?.message ||
//       err.message ||
//       "Server error";
//     throw new Error(msg);
//   }
// };



// // FEEDBACK API

// // Submit or update feedback
// export const submitFeedback = (eventId, data) =>
//   postRequest(`/feedback/${eventId}`, data);

// // Get event feedback + stats
// export const fetchEventFeedback = (eventId) =>
//   getRequest(`/feedback/${eventId}`);
// src/utils/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Auto attach token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// POST Request
export const postRequest = async (endpoint, data = {}) => {
  try {
    const res = await API.post(endpoint, data);
    return res.data;
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.message ||
      "Server error";
    throw new Error(msg);
  }
};

// GET Request
export const getRequest = async (endpoint) => {
  try {
    const res = await API.get(endpoint);
    return res.data;
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.message ||
      "Server error";
    throw new Error(msg);
  }
};

// FEEDBACK API

// Submit or update feedback
export const submitFeedback = (eventId, data) =>
  postRequest(`/feedback/${eventId}`, data);

// Get event feedback + stats
export const fetchEventFeedback = (eventId) =>
  getRequest(`/feedback/${eventId}`);
