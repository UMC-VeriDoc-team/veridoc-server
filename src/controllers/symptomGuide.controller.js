import symptomGuideService from '../services/symptomGuide.service.js';
import { sendSuccess } from '../utils/response.util.js';

const getGuide = async (req, res, next) => {
  try {
    const userId = req.user.userID;
    const painAreaId = BigInt(req.params.painAreaId);

    const data = await symptomGuideService.getGuide(userId, painAreaId);

    return sendSuccess(
      res,
      data,
      '증상 가이드 불러오기 성공',
      200
    );
  } catch (error) {
    next(error);
  }
};

export default {
  getGuide,
};