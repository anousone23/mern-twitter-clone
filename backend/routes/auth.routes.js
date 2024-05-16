import express from "express";

import {
  logout,
  signup,
  signin,
  getMe,
} from "../controllers/auth.controller.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.get("/me", protectRoute, getMe);

router.post("/sign-up", signup);
router.post("/sign-in", signin);
router.post("/logout", logout);

export default router;
