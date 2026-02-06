import express from 'express';
import TermsController from '../controllers/terms.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();
const termsController = new TermsController();

router.post('/agreements', authenticate, termsController.agreeToTerms);

export default router;
