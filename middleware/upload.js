const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");

// Check if Cloudinary is configured
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                      process.env.CLOUDINARY_API_KEY && 
                      process.env.CLOUDINARY_API_SECRET;

let cloudinaryUploader = null;

if (useCloudinary) {
  try {
    const cloudinary = require("cloudinary").v2;
    const { CloudinaryStorage } = require("multer-storage-cloudinary");
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const avatarStorage = new CloudinaryStorage({
      cloudinary,
      params: { folder: "educore/avatars", allowed_formats: ["jpg","jpeg","png","webp"] }
    });

    cloudinaryUploader = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });
  } catch(e) {
    console.log("Cloudinary not available, using local storage");
  }
}

// Local storage fallback
const storage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.env.UPLOAD_DIR || "./uploads", folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const fileFilter = (exts) => (req, file, cb) => {
  const ok = exts.some(e => file.originalname.toLowerCase().endsWith(e));
  cb(null, ok);
};

module.exports = {
  avatarUpload:    cloudinaryUploader || multer({ storage: storage("avatars"), fileFilter: fileFilter([".jpg",".jpeg",".png",".webp"]), limits: { fileSize: 5*1024*1024 } }),
  materialUpload:  multer({ storage: storage("materials"), fileFilter: fileFilter([".pdf",".doc",".docx",".ppt",".pptx",".zip"]), limits: { fileSize: 50*1024*1024 } }),
  videoUpload:     multer({ storage: storage("videos"), fileFilter: fileFilter([".mp4",".mov",".avi",".mkv"]), limits: { fileSize: 500*1024*1024 } }),
  thumbnailUpload: multer({ storage: storage("thumbnails"), fileFilter: fileFilter([".jpg",".jpeg",".png",".webp"]), limits: { fileSize: 5*1024*1024 } }),
};