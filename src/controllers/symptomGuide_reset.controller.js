//진행 상태 초기화
import symptomGuideResetService from '../services/symptomGuide_reset.service.js';
import { sendSuccess } from '../utils/response.util.js';

const resetGuide = async (req, res, next) => {
  try {
    const userId = BigInt(req.user.userID);
    const painAreaId = BigInt(req.params.painAreaId);

    const result = await symptomGuideResetService.resetGuide(
      userId,
      painAreaId
    );

    return sendSuccess(
      res,
      result,
      '증상 가이드 초기화 완료',
      200
    );
  } catch (err) {
    next(err);
  }
};

export default {
  resetGuide,
};