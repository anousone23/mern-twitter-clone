import express from "express";

import protectRoute from "../middlewares/protectRoute.js";
import {
  deleteAllNotifications,
  deleteNotification,
  getAllNotifications,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", protectRoute, getAllNotifications);

router.delete("/", protectRoute, deleteAllNotifications);
router.delete("/:id", protectRoute, deleteNotification);

export default router;
