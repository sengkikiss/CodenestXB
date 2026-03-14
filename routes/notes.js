const router = require("express").Router();
const auth   = require("../middleware/auth");
const roles  = require("../middleware/roles");
const ctrl   = require("../controllers/notesController");

router.get("/",       auth, ctrl.list);
router.post("/",      auth, roles("Admin","Teacher"), ctrl.create);
router.put("/:id",    auth, roles("Admin","Teacher"), ctrl.update);
router.delete("/:id", auth, roles("Admin","Teacher"), ctrl.remove);
module.exports = router;