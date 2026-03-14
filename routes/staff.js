const router = require("express").Router();
const auth   = require("../middleware/auth");
const roles  = require("../middleware/roles");
const ctrl   = require("../controllers/staffController");
const { avatarUpload } = require("../middleware/upload");

router.get("/",            auth, roles("Admin","Teacher","Staff"),  ctrl.list);
router.post("/",           auth, roles("Admin"),  ctrl.create);
router.get("/:id",         auth,                  ctrl.get);
router.put("/:id",         auth, roles("Admin"),  ctrl.update);
router.delete("/:id",      auth, roles("Admin"),  ctrl.remove);
router.post("/:id/avatar", auth, avatarUpload.single("avatar"), ctrl.uploadAvatar);
module.exports = router;