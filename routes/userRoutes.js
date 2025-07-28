const express = require("express");

const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");

const router = express.Router();

//=> Log in + sign up
router.post("/signup", authController.signUp);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

//=> forgot and reset password (for non-logged in users)
router.post("/forgot-password", authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);

// router.use(authController.protect);

//=> forgot and reset password (for logged in users)
router.patch("/update-password", authController.updatePassword);

//=> Get ME - get the info of current user
router.get("/me", userController.getMe, userController.getUser);

//=> Update the details of user (excluding passwords) [for logged-in users]
router.patch(
  "/update-info",
  userController.uploadUserPhoto,
  userController.formatUserPhoto,
  userController.updateMe,
);

//=> Delete of user (Just deactivate user) [for logged-in users]
router.delete("/delete-me", userController.deleteMe);

// router.use(authController.restrictTo("admin"));

//=> API routes
router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
