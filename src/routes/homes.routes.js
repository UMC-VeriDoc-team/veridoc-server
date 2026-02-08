import express from 'express';
import HomeController from '../controllers/home.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();
const controller = new HomeController();

// /homes
// 인증 필요한 라우트
router.get('/', authenticate, controller.getHome);

// /expert-answers
// 전문의 답변 요약본
router.get('/:answerId/summary', authenticate, controller.getDoctorAnswerSummary);
// 전문의 답변 상세
router.get('/:answerId', authenticate, controller.getDoctorAnswerDetail);

export default router;
