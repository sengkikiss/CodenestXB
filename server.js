// backend/server.js
// Main Express entry point. Mounts all routers.

require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const rateLimit  = require("express-rate-limit");
const path       = require("path");

const app = express();

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Global rate limit: 100 req / 15 min per IP
app.use(rateLimit({ windowMs: 1 * 60 * 1000, max: 500, message: "Too many requests" }));

// ─── STATIC UPLOADS ──────────────────────────────────────────────────────────
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
}, express.static(path.join(__dirname, "uploads")));

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use("/api/auth",       require("./routes/auth"));
app.use("/api/students",   require("./routes/students"));
app.use("/api/teachers",   require("./routes/teachers"));
app.use("/api/staff",      require("./routes/staff"));
app.use("/api/courses",    require("./routes/courses"));
app.use("/api/videos",     require("./routes/videos"));
app.use("/api/payments",   require("./routes/payments"));
app.use("/api/notes",      require("./routes/notes"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/reports",    require("./routes/reports"));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`EduCore API running on port ${PORT}`));