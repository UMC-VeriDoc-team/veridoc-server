import express from 'express';
import symptomGuideController from '../controllers/symptomGuide.controller.js';
import symptomGuideValidateController from '../controllers/symptomGuide_validate.controller.js';
import symptomGuideEventsController from '../controllers/symptomGuide_events.controller.js';
import symptomGuideResetController from '../controllers/symptomGuide_reset.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * API 1
 * 증상 가이드 조회
 * GET /api/v1/symptoms/:painAreaId/guide
 */
router.get(
  '/:painAreaId/guide',
  authenticate,
  symptomGuideController.getGuide
);

/**
 * API 2
 * 단계 이동 가능 여부 검증
 * POST /api/v1/symptoms/:painAreaId/guide/validate
 */
router.post(
  '/:painAreaId/guide/validate',
  authenticate,
  symptomGuideValidateController.validateGuideStep
);

/**
 * API 3
 * 트리거 해제용
 * POST /api/v1/symptoms/:painAreaId/guide/events
 */
router.post(
  '/:painAreaId/guide/events',
  authenticate,
  symptomGuideEventsController.recordGuideEvent
);

/**
 * API 4
 * 진행 상태 초기화
 * POST /api/v1/symptoms/:painAreaId/guide/reset
 */
router.post(
  '/:painAreaId/guide/reset',
  authenticate,
  symptomGuideResetController.resetGuide
);

export default router;