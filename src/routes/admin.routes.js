import express from 'express';
import AdminController from '../controllers/admin.controller.js';

const router = express.Router();
const adminController = new AdminController();

router.post('/issue-master-token', adminController.issueMasterToken);

export default router