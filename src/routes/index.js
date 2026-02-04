import dotenv from "dotenv";
import express from 'express';
import userRoutes from './user.routes.js';
import hospitalRoutes from './hospital.routes.js';
import painAreaRoutes from './painArea.routes.js';
import adminRoutes from './admin.routes.js';
import lifestyleGuideRoutes from './lifestyleGuide.routes.js';


import homesRoutes from './homes.routes.js';

const router = express.Router();

router.use('/users', userRoutes);
<<<<<<< HEAD
router.use('/homes', homesRoutes);

=======
router.use('/hospital', hospitalRoutes);
router.use('/pain-areas', painAreaRoutes);
router.use('/admin', adminRoutes);
<<<<<<< HEAD
router.use('/lifestyle-videos', lifestyleGuideRoutes);
=======
>>>>>>> cca7d1161adb0adc8a261497bd0a24ccffc0206d
>>>>>>> 12e75c6d3d65a944b3044c9f41caa604e39aa486

export default router;
