import express from 'express';
import userRoutes from './user.routes.js';

import homesRoutes from './homes.routes.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/homes', homesRoutes);


export default router;
