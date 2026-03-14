const router = require("express").Router();
const auth   = require("../middleware/auth");
const roles  = require("../middleware/roles");
const ctrl   = require("../controllers/attendanceController");

router.get("/",             auth, roles("Admin","Teacher","Staff"), ctrl.list);
router.get("/check-locked", auth, roles("Admin","Teacher"),         ctrl.checkLocked);
router.get("/course",       auth, roles("Admin","Teacher"),         ctrl.getCourseAttendance);
router.get("/dates",        auth, roles("Admin","Teacher","Staff"), ctrl.getCourseDates);
router.get("/date-records", auth, roles("Admin","Teacher","Staff"), ctrl.getDateRecords);
router.post("/mark",        auth, roles("Admin","Teacher"),         ctrl.mark);
router.get("/report",       auth, roles("Admin","Teacher","Staff"), ctrl.report);
router.get("/summary",      auth, roles("Admin","Teacher","Staff"), ctrl.summary);
router.get("/student/:id",  auth,                                   ctrl.studentAttendance);
module.exports = router;