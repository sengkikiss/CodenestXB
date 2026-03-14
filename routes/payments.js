const router = require("express").Router();
const auth   = require("../middleware/auth");
const roles  = require("../middleware/roles");
const ctrl   = require("../controllers/paymentController");

router.get("/",              auth, roles("Admin","Staff","Teacher"),    ctrl.list);
router.post("/",             auth, roles("Admin","Staff"),    ctrl.create);
router.get("/report",        auth, roles("Admin"),            ctrl.report);
router.get("/:id/invoice",   auth,                            ctrl.invoice);
router.get("/student/:id",   auth,                            ctrl.studentPayments);
router.put("/:id/status",    auth, roles("Admin","Staff"),    ctrl.updateStatus);
module.exports = router;