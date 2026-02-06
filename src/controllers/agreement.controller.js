import AgreementService from '../services/agreement.service.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';

class AgreementController {
  constructor(service = new AgreementService()) {
    this.service = service;

    this.agree = this.agree.bind(this);
    this.getMyAgreements = this.getMyAgreements.bind(this);
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

  // POST /api/v1/agreements
  async agree(req, res, next) {
    try {
      const userID = this._getAuthUserId(req);
      if (!userID) {
        throw new ApiError(401, errorCodes.UNAUTHORIZED, '인증이 필요합니다.');
      }

      const result = await this.service.agree(userID, req.body);

      return res.status(200).json({
        ok: true,
        agreedAt: result.agreedAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/agreements/me
  async getMyAgreements(req, res, next) {
    try {
      const userID = this._getAuthUserId(req);
      if (!userID) {
        throw new ApiError(401, errorCodes.UNAUTHORIZED, '인증이 필요합니다.');
      }

      const agreements = await this.service.getMyAgreements(userID);

      return res.status(200).json({
        ok: true,
        agreements,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default AgreementController;
