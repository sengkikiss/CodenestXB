const router   = require("express").Router();
const auth     = require("../middleware/auth");
const roles    = require("../middleware/roles");
const ctrl     = require("../controllers/authController");
const { body } = require("express-validator");
const validate = require("../middleware/validate");

router.post("/login",    [body("email").isEmail(), body("password").notEmpty(), validate], ctrl.login);
router.post("/register", auth, roles("Admin"), [body("email").isEmail(), body("name").notEmpty(), validate], ctrl.register);
router.get("/me",        auth, ctrl.me);
router.put("/profile",   auth, ctrl.updateProfile);
router.put("/password",  auth, ctrl.changePassword);
router.post("/avatar",   auth, require("../middleware/upload").avatarUpload.single("avatar"), ctrl.uploadAvatar);
module.exports = router;