import express from 'express';
import AgreementController from '../controllers/agreement.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();
const agreementController = new AgreementController();

// POST /api/v1/agreements - 약관 동의
router.post('/', authenticate, agreementController.agree);

// GET /api/v1/agreements/me - 내 약관 동의 현황 조회
router.get('/me', authenticate, agreementController.getMyAgreements);

export default router;
