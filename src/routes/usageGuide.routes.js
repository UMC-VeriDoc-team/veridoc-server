import express from 'express';
import UsageGuideController from '../controllers/usageGuide.controller.js';

const router = express.Router();
const controller = new UsageGuideController();

// GET /api/v1/usage-guides
router.get('/', controller.getSourceLinks);

export default router;
