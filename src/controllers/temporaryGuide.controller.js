import TemporaryGuideService from '../services/temporaryGuide.service.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';
import { verifyAccessToken } from '../utils/jwt.util.js';
import { sendSuccess } from '../utils/response.util.js';

class TemporaryGuideController {
  constructor(service = new TemporaryGuideService()) {
    this.service = service;
    this.getTemporaryGuideIds = this.getTemporaryGuideIds.bind(this);
    this.getTemporaryGuideDetail = this.getTemporaryGuideDetail.bind(this);
  }

  _extractToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, errorCodes.UNAUTHORIZED, '로그인이 필요합니다.');
    }

    return authHeader.split(' ')[1];
  }

  async getTemporaryGuideIds(req, res, next) {
    try {
      const guides = await this.service.getGuideIds();
      return sendSuccess(res, { guides }, "임시 대처 가이드 ID 조회 성공");
    } catch (err) {
      return next(err);
    }
  }

  async getTemporaryGuideDetail(req, res, next) {
    try {
      const token = this._extractToken(req);
      try {
        verifyAccessToken(token);
      } catch (_) {
        throw new ApiError(401, errorCodes.UNAUTHORIZED, '로그인이 필요합니다.');
      }

      const guideId = Number(req.params.guideId);
      const data = await this.service.getGuideDetail(guideId);

      return sendSuccess(res, data, '임시 대처 가이드 상세 조회 성공');
    } catch (err) {
      return next(err);
    }
  }
}

export default TemporaryGuideController;
