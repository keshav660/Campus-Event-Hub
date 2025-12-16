// require("dotenv").config();
// const express = require("express");
// const http = require("http");
// const cors = require("cors");
// const connectDB = require("./config/db");

// const authRoutes = require("./routes/auth");
// const eventRoutes = require("./routes/event");
// const statsRoutes = require("./routes/stats");
// const registrationRoutes = require("./routes/registrations");
// const feedbackRoutes = require("./routes/feedback");

// const app = express();

// // Body parser limits
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ limit: "10mb", extended: true }));

// // Create HTTP server
// const server = http.createServer(app);
// const { Server } = require("socket.io");

// const FRONTEND_ORIGIN =
//   process.env.CLIENT_URL ||
//   process.env.FRONTEND_URL ||
//   "http://localhost:3000";

// // Socket.IO setup
// const io = new Server(server, {
//   cors: {
//     origin: FRONTEND_ORIGIN,
//     methods: ["GET", "POST", "PUT", "DELETE"],
//   },
// });

// // CORS middleware
// app.use(
//   cors({
//     origin: FRONTEND_ORIGIN,
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   })
// );

// // attach io to app for controllers
// app.set("io", io);

// // Connect to MongoDB
// connectDB(process.env.MONGO_URI);

// // ROUTES
// app.use("/api/auth", authRoutes);
// app.use("/api/events", eventRoutes);
// app.use("/api/stats", statsRoutes);
// app.use("/api/registrations", registrationRoutes);

// app.use("/api/feedback", feedbackRoutes);

// // Test endpoint
// app.post("/test", (req, res) => {
//   console.log("✅ Got request on /test");
//   res.json({ success: true });
// });

// // Root endpoint
// app.get("/", (req, res) => res.send("API running"));

// // SOCKET EVENTS
// io.on("connection", (socket) => {
//   console.log("🔌 Socket connected:", socket.id);

//   socket.on("disconnect", () => {
//     console.log("🔌 Socket disconnected:", socket.id);
//   });
// });

// // Start Server
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/event");
const statsRoutes = require("./routes/stats");
const registrationRoutes = require("./routes/registrations");
const feedbackRoutes = require("./routes/feedback");

const app = express();

// Body parser limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Create HTTP server
const server = http.createServer(app);
const { Server } = require("socket.io");

const FRONTEND_ORIGIN =
  process.env.CLIENT_URL ||
  process.env.FRONTEND_URL ||
  "http://localhost:3000";

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// CORS middleware
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// attach io to app for controllers (if needed)
app.set("io", io);

// Connect to MongoDB
connectDB(process.env.MONGO_URI);

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/feedback", feedbackRoutes);

// Test endpoint
app.post("/test", (req, res) => {
  console.log("✅ Got request on /test");
  res.json({ success: true });
});

// Root endpoint
app.get("/", (req, res) => res.send("API running"));

// SOCKET EVENTS
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected:", socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
