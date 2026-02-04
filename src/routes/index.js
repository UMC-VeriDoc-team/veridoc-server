import dotenv from "dotenv";
import express from 'express';
import userRoutes from './user.routes.js';
import hospitalRoutes from './hospital.routes.js';
import painAreaRoutes from './painArea.routes.js';
import adminRoutes from './admin.routes.js';
import lifestyleGuideRoutes from './lifestyleGuide.routes.js';


const router = express.Router();

router.use('/users', userRoutes);
router.use('/hospital', hospitalRoutes);
router.use('/pain-areas', painAreaRoutes);
router.use('/admin', adminRoutes);
router.use('/symptoms', lifestyleGuideRoutes);

export default router;
