import dotenv from "dotenv";
import express from 'express';
import userRoutes from './user.routes.js';
import hospitalRoutes from './hospital.routes.js';
import painAreaRoutes from './painArea.routes.js';
import adminRoutes from './admin.routes.js';
import homesRoutes from './homes.routes.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/homes', homesRoutes);
router.use('/hospital', hospitalRoutes);
router.use('/pain-areas', painAreaRoutes);
router.use('/admin', adminRoutes);

export default router;
