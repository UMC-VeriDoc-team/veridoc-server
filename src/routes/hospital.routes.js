import express from 'express';
import HospitalController from '../controllers/hospital.controller.js';

const router = express.Router();
const hospitalController = new HospitalController();

// GET /api/v1/hospital/nearby - 사용자 위치 기준 가까운 병원 조회
router.get('/nearby', hospitalController.getNearbyHospitals);

export default router;
