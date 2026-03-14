// backend/middleware/upload.js
// Multer config for avatar, materials, and video uploads.
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

const storage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.env.UPLOAD_DIR || "./uploads", folder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, unique + path.extname(file.originalname));
    },
  });

const fileFilter = (allowed) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  cb(null, allowed.includes(ext));
};

module.exports = {
  avatarUpload:   multer({ storage: storage("avatars"),   fileFilter: fileFilter([".jpg",".jpeg",".png",".webp"]), limits: { fileSize: 5 * 1024 * 1024 } }),
  materialUpload: multer({ storage: storage("materials"), fileFilter: fileFilter([".pdf",".doc",".docx",".ppt",".pptx",".zip"]), limits: { fileSize: 50 * 1024 * 1024 } }),
  videoUpload:    multer({ storage: storage("videos"),    fileFilter: fileFilter([".mp4",".mov",".avi",".mkv"]), limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024 * 1024 } }),
};
