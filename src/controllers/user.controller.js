import UserService from '../services/user.service.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';

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
      const users = await this.service.list()
      
      res.json({
        code : 200,
        message : '사용자 목록 조회 성공',
        data : {users},
      })
    } catch (err) {
      next(err)
    }
  }
  
  //유저 조회
  async getUser(req, res, next) {
    try {
      const user = await this.service.findById(parseInt(req.params.id, 10))
      if (!user) {
        throw new ApiError(404, errorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.')
      }
      res.json({
        code : 200,
        message : '사용자 조회 성공',
        data : {user},
      })
    } catch (err) {
      next(err)
    }
  }

  // 회원가입 (유저 생성)
  async createUser(req, res, next) {
    try {
      const createdUser = await this.service.create(req.body)

      res.status(201).json({
        code : 201,
        message : '회원가입이 완료되었습니다.',
        data : createdUser,
      })
    } catch (err) {
      next(err)
    }
  }
  
  // 유저 정보 수정
  async updateUser(req, res, next) {
    try {
      const updatedUser = await this.service.update(parseInt(req.params.id, 10), req.body);
      res.json({
        code : 200,
        message : '사용자 정보 수정 성공',
        data : {updatedUser},
      })
    } catch (err) {
      next(err);
    }
  }

  // 유저 삭제
  async deleteUser(req, res, next) {
    try {
      await this.service.remove(parseInt(req.params.id, 10));
      res.json({
        code : 200,
        message : '사용자 삭제 성공',
        data : null,
      })
    } catch (err) {
      next(err);
    }
  }
}

export default UserController;
