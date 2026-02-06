import express from "express";
import HomeController from "../controllers/home.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();
const controller = new HomeController();

router.get("/ids", controller.getAllAnswerIds);
router.get("/:answerId/summary", authenticate, controller.getDoctorAnswerSummary);
router.get("/:answerId", authenticate, controller.getDoctorAnswerDetail);

export default router;
