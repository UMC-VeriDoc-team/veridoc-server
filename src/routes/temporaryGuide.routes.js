import express from 'express';
import TemporaryGuideController from '../controllers/temporaryGuide.controller.js';

const router = express.Router();
const controller = new TemporaryGuideController();

router.get('/ids', controller.getTemporaryGuideIds);
router.get('/:guideId', controller.getTemporaryGuideDetail);

export default router;
