require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");
const path      = require("path");

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// Allow all origins - fixes CORS on Railway
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS","PATCH"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.options("*", cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 500, message: "Too many requests" }));

app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
}, express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`EduCore API running on port ${PORT}`));