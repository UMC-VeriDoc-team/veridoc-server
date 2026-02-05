import UserService from '../services/user.service.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';
import { sendSuccess } from '../utils/response.util.js';

class UserController {
  constructor(service = new UserService()) {
    this.service = service;

    // 기존
    this.listUsers = this.listUsers.bind(this);
    this.getUser = this.getUser.bind(this);
    this.createUser = this.createUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.login = this.login.bind(this);

    // 마이페이지
    this.getMe = this.getMe.bind(this);
    this.updateMe = this.updateMe.bind(this);
    this.updatePainArea = this.updatePainArea.bind(this);
  }

  // 내부 유틸 메서드
  _getAuthUserId(req) {
    return (
      req?.user?.userID ??
      req?.user?.userId ??
      req?.user?.id ??
      req?.userID ??
      req?.userId
    );
  }

  // 기존 메서드들
  async listUsers(req, res, next) {
    try {
      const users = await this.service.list();
      sendSuccess(res, { users }, '사용자 목록 조회 성공');
    } catch (err) {
      next(err);
    }
  }

  async getUser(req, res, next) {
    try {
      const user = await this.service.findById(parseInt(req.params.id, 10));
      if (!user) {
        throw new ApiError(404, errorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
      }
      sendSuccess(res, { user }, '사용자 조회 성공');
    } catch (err) {
      next(err);
    }
  }

  async createUser(req, res, next) {
    try {
      const createdUser = await this.service.create(req.body);
      sendSuccess(res, createdUser, '회원가입이 완료되었습니다.', 201);
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const result = await this.service.login(req.body);
      sendSuccess(res, result, '로그인 성공');
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req, res, next) {
    try {
      const updatedUser = await this.service.update(
        parseInt(req.params.id, 10),
        req.body
      );
      sendSuccess(res, { updatedUser }, '사용자 정보 수정 성공');
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      await this.service.remove(parseInt(req.params.id, 10));
      sendSuccess(res, null, '사용자 삭제 성공');
    } catch (err) {
      next(err);
    }
  }

  // 마이페이지

  // 2.1.1 사용자 정보 조회
  async getMe(req, res, next) {
    try {
      const userID = this._getAuthUserId(req);
      if (!userID) {
        throw new ApiError(401, errorCodes.UNAUTHORIZED, '인증이 필요합니다.');
      }

      const me = await this.service.getMe(userID);
      sendSuccess(res, me, '사용자 정보 조회 성공');
    } catch (err) {
      next(err);
    }
  }

  // 2.1.2 사용자 정보 수정
  async updateMe(req, res, next) {
    try {
      const userID = this._getAuthUserId(req);
      if (!userID) {
        throw new ApiError(401, errorCodes.UNAUTHORIZED, '인증이 필요합니다.');
      }

      if ('email' in req.body) {
        throw new ApiError(400, errorCodes.INVALID_REQUEST, '이메일은 변경할 수 없습니다.');
      }

      await this.service.updateMe(userID, req.body);
      sendSuccess(res, null, '사용자 정보 수정 성공');
    } catch (err) {
      next(err);
    }
  }

  // 2.1.4 주요 아픈 부위 저장
  async updatePainArea(req, res, next) {
    try {
      const userID = this._getAuthUserId(req);
      if (!userID) {
        throw new ApiError(401, errorCodes.UNAUTHORIZED, '인증이 필요합니다.');
      }

      const { painAreaID } = req.body;
      if (painAreaID === undefined) {
        throw new ApiError(400, errorCodes.INVALID_REQUEST, 'painAreaID 값이 필요합니다.');
      }

      const result = await this.service.updatePainArea(userID, painAreaID);
      sendSuccess(res, result, '주요 아픈 부위 저장 성공');
    } catch (err) {
      next(err);
    }
  }
}

export default UserController;
