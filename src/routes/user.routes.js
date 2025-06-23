import express from "express";
import { upload } from "../middlewares/multer.midddleware.js";
import { loginUser, logout, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT,logout);
router.route("/refresh-token").post(refreshAccessToken);
export default router;
