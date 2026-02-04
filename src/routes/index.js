import dotenv from "dotenv";
import express from 'express';
import userRoutes from './user.routes.js';
import hospitalRoutes from './hospital.routes.js';
import painAreaRoutes from './painArea.routes.js';
import adminRoutes from './admin.routes.js';


import homesRoutes from './homes.routes.js';

const router = express.Router();

router.use('/users', userRoutes);
<<<<<<< HEAD
router.use('/homes', homesRoutes);

=======
router.use('/hospital', hospitalRoutes);
router.use('/pain-areas', painAreaRoutes);
router.use('/admin', adminRoutes);
>>>>>>> cca7d1161adb0adc8a261497bd0a24ccffc0206d

export default router;
