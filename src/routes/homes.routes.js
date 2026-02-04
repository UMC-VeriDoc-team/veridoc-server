import express from 'express';
import HomeController from '../controllers/home.controller.js';

const router = express.Router();
const controller = new HomeController();


router.get('/', controller.getHome);
router.get('/doctor-answers/:answerId/summary', controller.getDoctorAnswerSummary);

export default router;
