


import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// GET Request with Token
export const getRequest = async (endpoint, token) => {
  try {
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};
    
    const res = await API.get(endpoint, config);
    return res.data;
  } catch (err) {
    console.error("GET API Error:", err);
    const msg =
      err.response?.data?.message ||
      err.message ||
      "Server not responding. Try again later.";
    throw new Error(msg);
  }
};

// POST Request with Token
export const postRequest = async (endpoint, data, token) => {
  try {
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};
    
    const res = await API.post(endpoint, data, config);
    return res.data;
  } catch (err) {
    console.error("POST API Error:", err);
    const msg =
      err.response?.data?.message ||
      err.message ||
      "Server not responding. Try again later.";
    throw new Error(msg);
  }
};

// PUT Request with Token
export const putRequest = async (endpoint, data, token) => {
  try {
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};
    
    const res = await API.put(endpoint, data, config);
    return res.data;
  } catch (err) {
    console.error("PUT API Error:", err);
    const msg =
      err.response?.data?.message ||
      err.message ||
      "Server not responding. Try again later.";
    throw new Error(msg);
  }
};

// DELETE Request with Token
export const deleteRequest = async (endpoint, token) => {
  try {
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};
    
    const res = await API.delete(endpoint, config);
    return res.data;
  } catch (err) {
    console.error("DELETE API Error:", err);
    const msg =
      err.response?.data?.message ||
      err.message ||
      "Server not responding. Try again later.";
    throw new Error(msg);
  }
};

export default API;