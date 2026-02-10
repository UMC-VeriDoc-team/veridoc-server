import dotenv from "dotenv";
import express from 'express';
import userRoutes from './user.routes.js';
import hospitalRoutes from './hospital.routes.js';
import painAreaRoutes from './painArea.routes.js';
import adminRoutes from './admin.routes.js';
import homesRoutes from './homes.routes.js';
import expertAnswerRoutes from './expertAnswer.routes.js';
import lifestyleGuideRoutes from './lifestyleGuide.routes.js';
import agreementRoutes from './agreement.routes.js';
import temporaryGuideRoutes from './temporaryGuide.routes.js';
import symptomGuideRoutes from './symptomGuide.routes.js';
import usageGuideRoutes from './usageGuide.routes.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/homes', homesRoutes);
router.use('/expert-answers', expertAnswerRoutes);
router.use('/hospital', hospitalRoutes);
router.use('/pain-areas', painAreaRoutes);
router.use('/admin', adminRoutes);
router.use('/lifestyle-videos', lifestyleGuideRoutes);
router.use('/agreements', agreementRoutes);
router.use('/temporary-guides', temporaryGuideRoutes);
router.use('/symptoms', symptomGuideRoutes);
router.use('/usage-guides', usageGuideRoutes);
export default router;
