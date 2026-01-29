import express from 'express';
import UserController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js'; // 마스터 토큰까지 검증하는 미들웨어

const router = express.Router();
const userController = new UserController();

// 토큰 없이 허용
router.post('/signup', userController.createUser);  // /signup은 /:id 위에 위치해야 함
router.post('/login', userController.login);  // login 역시 /:id 위에 위치해야 함

// 일반 토큰 또는 마스터 토큰 모두 통과
router.get('/', authenticate, userController.listUsers);
router.get('/:id', authenticate, userController.getUser);
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, userController.deleteUser);

export default router;
