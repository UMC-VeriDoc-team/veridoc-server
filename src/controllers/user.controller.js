import UserService from '../services/user.service.js';
import ApiError from '../errors/ApiError.js';

class UserController {
  constructor(service = new UserService()) {
    this.service = service;
    this.listUsers = this.listUsers.bind(this);
    this.getUser = this.getUser.bind(this);
    this.createUser = this.createUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
  }

  async listUsers(req, res, next) {
    try {
      const users = await this.service.list();
      res.json({ success: true, message: 'users fetched', data: users, code: 'OK' });
    } catch (err) {
      next(err);
    }
  }

  async getUser(req, res, next) {
    try {
      const user = await this.service.findById(parseInt(req.params.id, 10));
      if (!user) throw new ApiError(404, 'USER_NOT_FOUND', '유저를 찾을 수 없습니다.');
      res.json({ success: true, message: 'user fetched', data: user, code: 'OK' });
    } catch (err) {
      next(err);
    }
  }

  async createUser(req, res, next) {
    try {
      const created = await this.service.create(req.body);
      res.status(201).json({ success: true, message: 'created', data: created, code: 'OK' });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req, res, next) {
    try {
      const updated = await this.service.update(parseInt(req.params.id, 10), req.body);
      res.json({ success: true, message: 'updated', data: updated, code: 'OK' });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      await this.service.remove(parseInt(req.params.id, 10));
      res.json({ success: true, message: 'deleted', data: null, code: 'OK' });
    } catch (err) {
      next(err);
    }
  }
}

export default UserController;
