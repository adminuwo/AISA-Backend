import express, { urlencoded } from "express";
import dotenv from "dotenv";
import 'dotenv/config';
import cors from "cors";
import connectDB from "./config/db.js";
import chatRoutes from "./routes/chatRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import emailVerification from "./routes/emailVerification.js"
import userRoute from './routes/user.js'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import chatRoute from './routes/chat.routes.js';
import knowledgeRoute from './routes/knowledge.routes.js';
// import aibaseRoutes from './routes/aibaseRoutes.js'; // Removed
// import * as aibaseService from './services/aibaseService.js'; // Removed

import notificationRoutes from "./routes/notificationRoutes.js";
import supportRoutes from './routes/supportRoutes.js';
import personalTaskRoutes from './routes/personalTaskRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import imageRoutes from './routes/image.routes.js';
import videoRoutes from './routes/videoRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// End of standard imports

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

console.log("--- STARTUP DEBUG ---");
console.log("PORT from env:", process.env.PORT);
console.log("Effective PORT:", PORT);
console.log("MONGO_URI from env:", process.env.MONGODB_URI);
console.log("MONGODB_ATLAS_URI from env:", process.env.MONGODB_ATLAS_URI);
console.log("---------------------");

// Connect to Database
connectDB().then(() => {
  console.log("Database connection attempt finished, initializing services...");
  // aibaseService init removed
}).catch(error => {
  console.error("Database connection failed during startup:", error);
});


// Middleware

app.use(cors({
  origin: true, // Allow any origin in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser())
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// app.use(fileUpload()); // Removed to avoid conflict with Multer (New AIBASE)

app.get("/ping-top", (req, res) => {
  res.send("Top ping works");
})

// (Static serving removed for separate frontend deployment)
// app.use(express.static(path.join(__dirname, 'public')));

// API Health Check (moved from root)
app.get("/api/health", (req, res) => {
  res.send("All working")
})
// Global Debug middleware
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// --- API Routes Registration ---

// Auth & User
app.use('/api/auth/verify-email', emailVerification);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoute);

// Intelligence Features
app.use('/api/chat', chatRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/video', videoRoutes);

// Utility & Support
app.use('/api/notifications', notificationRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/personal-assistant', personalTaskRoutes);

// Business & Dashboard
app.use('/api/payment', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', dashboardRoutes);

// Admin Panel (Admin only)
app.use('/api/admin', adminRoutes);

// AIBASE (V3) - Cleaned up
app.use('/api/aibase/chat', chatRoute);
app.use('/api/aibase/knowledge', knowledgeRoute);
// app.use('/api/aibase', aibaseRoutes); // Removed unused route

// --- End of Routes ---

// (SPA Catch-all removed for separate frontend deployment)
// app.get('*', ...);

// Catch-all 404 for API routes
app.use((req, res) => {
  console.warn(`[404 NOT MATCHED] ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Route not found",
    method: req.method,
    path: req.originalUrl
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[SERVER ERROR]", err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start listening
app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI-Mall Backend running on http://0.0.0.0:${PORT}`);
  console.log("Razorpay Config Check:", {
    KeyID: process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.substring(0, 8)}...` : "MISSING",
    Secret: process.env.RAZORPAY_KEY_SECRET ? "PRESENT" : "MISSING"
  });
});

// Keep process alive for local development
setInterval(() => { }, 1000 * 60 * 60); // Keep alive process