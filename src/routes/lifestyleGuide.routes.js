import express from 'express';
import LifestyleGuideController from '../controllers/lifestyleGuide.controller.js';

const router = express.Router();
const controller = new LifestyleGuideController();

router.get('/:painAreaId', controller.getLifestyleGuide);

export default router;