import TermsService from '../services/terms.service.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';

class TermsController {
  constructor(service = new TermsService()) {
    this.service = service;

    this.agreeToTerms = this.agreeToTerms.bind(this);
  }

  _getAuthUserId(req) {
    return (
      req?.user?.userID ??
      req?.user?.userId ??
      req?.user?.id ??
      req?.userID ??
      req?.userId
    );
  }

  async agreeToTerms(req, res) {
    try {
      const userId = this._getAuthUserId(req);
      if (!userId) {
        throw new ApiError(401, errorCodes.UNAUTHORIZED, '로그인이 필요합니다.');
      }

      const result = await this.service.createAgreement(userId, req.body);
      const agreedAt = result?.agreed_at instanceof Date
        ? result.agreed_at.toISOString()
        : new Date().toISOString();

      return res.status(200).json({
        ok: true,
        agreedAt,
      });
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

export default TermsController;
