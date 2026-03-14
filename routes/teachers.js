const router = require("express").Router();
const auth   = require("../middleware/auth");
const roles  = require("../middleware/roles");
const ctrl   = require("../controllers/teacherController");
const { avatarUpload } = require("../middleware/upload");

router.get("/",              auth, roles("Admin","Staff","Teacher"),  ctrl.list);
router.post("/",             auth, roles("Admin"),          ctrl.create);
router.get("/:id",           auth,                          ctrl.get);
router.put("/:id",           auth, roles("Admin"),          ctrl.update);
router.delete("/:id",        auth, roles("Admin"),          ctrl.remove);
router.get("/:id/schedule",  auth,                          ctrl.schedule);
router.post("/:id/avatar",   auth, avatarUpload.single("avatar"), ctrl.uploadAvatar);
module.exports = router;