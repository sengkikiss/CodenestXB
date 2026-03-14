const router = require("express").Router();
const auth   = require("../middleware/auth");
const roles  = require("../middleware/roles");
const ctrl   = require("../controllers/videoController");
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

// Ensure upload dirs exist
["videos","thumbnails"].forEach(d => {
  const p = path.join(__dirname, "../uploads", d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.fieldname === "thumbnail" ? "thumbnails" : "videos";
    cb(null, path.join(__dirname, "../uploads", dir));
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"))
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

router.get("/",              auth, ctrl.list);
router.post("/",             auth, roles("Admin","Teacher"), upload.fields([{ name:"video",max:1 },{ name:"thumbnail",max:1 }]), ctrl.upload);
router.delete("/:id",        auth, roles("Admin","Teacher"), ctrl.remove);
router.get("/stream/:file",  ctrl.stream);
module.exports = router;