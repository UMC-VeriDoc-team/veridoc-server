import dotenv from "dotenv";
import express from 'express';
import userRoutes from './user.routes.js';
import painAreaRoutes from './painArea.routes.js';
import adminRoutes from './admin.routes.js';


const router = express.Router();

router.use('/users', userRoutes);
router.use('/pain-areas', painAreaRoutes);
router.use('/admin', adminRoutes);

export default router;
