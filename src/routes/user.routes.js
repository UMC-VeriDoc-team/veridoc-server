import express from 'express';
import UserController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();
const userController = new UserController();

// 토큰 없이 허용
router.post('/signup', userController.createUser);
router.post('/login', userController.login);

// 마이페이지 (반드시 /:id 보다 위에!)
router.get('/me', authenticate, userController.getMe);
router.put('/me', authenticate, userController.updateMe);
router.put('/me/pain-area', authenticate, userController.updatePainArea);
router.delete('/me', authenticate, userController.deleteMe);

// 아래는 일반 CRUD (/:id)
router.get('/', authenticate, userController.listUsers);
router.get('/:id', authenticate, userController.getUser);
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, userController.deleteUser);

export default router;
