import express from 'express';
import HomeController from '../controllers/home.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();
const controller = new HomeController();

// 인증 필요한 라우트
router.get('/', authenticate, controller.getHome);
router.get('/doctor-answers/:answerId', authenticate, controller.getDoctorAnswerDetail);

export default router;
