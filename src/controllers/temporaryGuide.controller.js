import TemporaryGuideService from '../services/temporaryGuide.service.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';
import { verifyAccessToken } from '../utils/jwt.util.js';

class TemporaryGuideController {
  constructor(service = new TemporaryGuideService()) {
    this.service = service;
    this.getTemporaryGuideDetail = this.getTemporaryGuideDetail.bind(this);
  }

  _extractToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, errorCodes.UNAUTHORIZED, '로그인이 필요합니다.');
    }

    return authHeader.split(' ')[1];
  }

  async getTemporaryGuideDetail(req, res) {
    try {
      const token = this._extractToken(req);
      try {
        verifyAccessToken(token);
      } catch (_) {
        throw new ApiError(401, errorCodes.UNAUTHORIZED, '로그인이 필요합니다.');
      }

      const guideId = Number(req.params.guideId);
      const data = await this.service.getGuideDetail(guideId);

      return res.status(200).json({ data });
    } catch (err) {
      if (err instanceof ApiError) {
        return res.status(err.status || 500).json({
          error: {
            code: err.code || errorCodes.SERVER_ERROR,
            message: err.message || '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          },
        });
      }

      return res.status(500).json({
        error: {
          code: errorCodes.SERVER_ERROR,
          message: '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        },
      });
    }
  }
}

export default TemporaryGuideController;
