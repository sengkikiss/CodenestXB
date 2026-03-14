const router = require("express").Router();
const auth   = require("../middleware/auth");
const roles  = require("../middleware/roles");
const ctrl   = require("../controllers/reportController");

router.get("/students",   auth, roles("Admin","Staff"), ctrl.students);
router.get("/payments",   auth, roles("Admin","Staff"), ctrl.payments);
router.get("/attendance", auth, roles("Admin","Staff"), ctrl.attendance);
router.get("/courses",    auth, roles("Admin","Staff"), ctrl.courses);
module.exports = router;
