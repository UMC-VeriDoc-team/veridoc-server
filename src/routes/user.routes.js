import express from 'express';
import UserController from '../controllers/user.controller.js';

const router = express.Router();
const userController = new UserController();

router.get('/', userController.listUsers);
router.get('/:id', userController.getUser);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
