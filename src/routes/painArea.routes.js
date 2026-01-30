import express from 'express';
import PainAreaController from '../controllers/painArea.controller.js';

const router = express.Router();
const controller = new PainAreaController();

// /api/v1/pain-areas
router.get('/', controller.listPainAreas);

export default router;