import express from 'express';
import userRoutes from './user.routes.js';
import hospitalRoutes from './hospital.routes.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/hospital', hospitalRoutes);

export default router;
