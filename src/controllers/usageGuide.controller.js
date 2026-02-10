import UsageGuideService from '../services/usageGuide.service.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';

class UsageGuideController {
  constructor(service = new UsageGuideService()) {
    this.service = service;
    this.getSourceLinks = this.getSourceLinks.bind(this);
  }

  async getSourceLinks(req, res, next) {
    try {
      const links = await this.service.getSourceLinks();

      return res.status(200).json({
        code: 200,
        message: '원문 출처 링크 조회 성공',
        data: { guides: links },
      });
    } catch (err) {
      return next(
        err instanceof ApiError ? err : new ApiError(500, errorCodes.INTERNAL_ERROR, '원문 출처 링크 조회 실패')
      );
    }
  }
}

export default UsageGuideController;
