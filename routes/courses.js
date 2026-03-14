const router = require("express").Router();
const auth   = require("../middleware/auth");
const roles  = require("../middleware/roles");
const ctrl   = require("../controllers/courseController");
const { materialUpload } = require("../middleware/upload");
router.get("/student/:userId", auth, ctrl.studentCourses);
router.get("/",    auth, ctrl.list);
router.post("/",   auth, roles("Admin"), ctrl.create);
router.get("/:id", auth, ctrl.get);
router.put("/:id", auth, roles("Admin","Teacher"), ctrl.update);
router.delete("/:id", auth, roles("Admin"), ctrl.remove);

// Enrollment
router.get("/:id/students",           auth, ctrl.enrolledStudents);
router.post("/:id/enroll",            auth, roles("Admin","Teacher"), ctrl.enroll);
router.delete("/:id/enroll/:studentId", auth, roles("Admin","Teacher"), ctrl.unenroll);

// Chapters
router.get("/:id/chapters",                       auth, ctrl.getChapters);
router.post("/:id/chapters",                      auth, roles("Admin","Teacher"), ctrl.createChapter);
router.put("/:id/chapters/:chapterId",             auth, roles("Admin","Teacher"), ctrl.updateChapter);
router.delete("/:id/chapters/:chapterId",          auth, roles("Admin","Teacher"), ctrl.deleteChapter);

// Materials
router.post("/:id/chapters/:chapterId/materials",          auth, roles("Admin","Teacher"), materialUpload.single("file"), ctrl.addMaterial);
router.delete("/:id/chapters/:chapterId/materials/:materialId", auth, roles("Admin","Teacher"), ctrl.deleteMaterial);

module.exports = router;