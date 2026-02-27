import express from "express";
import dotenv from "dotenv";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

import chatRoutes from "./routes/chatRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import emailVerification from "./routes/emailVerification.js";
import userRoute from "./routes/user.js";

import chatRoute from "./routes/chat.routes.js";
import knowledgeRoute from "./routes/knowledge.routes.js";

import notificationRoutes from "./routes/notificationRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import personalTaskRoutes from "./routes/personalTaskRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import imageRoutes from "./routes/image.routes.js";
import videoRoutes from "./routes/videoRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import memoryRoutes from "./routes/memoryRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

/* ================= DATABASE ================= */
connectDB()
  .then(() => console.log("✅ Database Connected"))
  .catch((err) => console.error("❌ DB Error:", err));

/* ================= MIDDLEWARE ================= */
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

/* ================= ROOT ROUTE FIX ================= */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    service: "AISA Backend",
    message: "AISA API is running successfully 🚀",
    timestamp: new Date().toISOString(),
  });
});

/* ================= BASIC API ROUTE ================= */
app.get("/api", (req, res) => {
  res.json({
    status: "success",
    message: "Welcome to AISA API",
  });
});

/* ================= HEALTH CHECK ================= */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

/* ================= API ROUTES ================= */

// Auth & User
app.use("/api/auth/verify-email", emailVerification);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoute);

// Intelligence
app.use("/api/chat", chatRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/image", imageRoutes);
app.use("/api/video", videoRoutes);

// Utility
app.use("/api/notifications", notificationRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/personal-assistant", personalTaskRoutes);
app.use("/api/memory", memoryRoutes);

// Business
app.use("/api/payment", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Admin
app.use("/api/admin", adminRoutes);

// AIBASE
app.use("/api/aibase/chat", chatRoute);
app.use("/api/aibase/knowledge", knowledgeRoute);

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
    method: req.method,
    path: req.originalUrl,
  });
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error("[SERVER ERROR]", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

/* ================= START SERVER ================= */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 AISA Backend running on port ${PORT}`);
});