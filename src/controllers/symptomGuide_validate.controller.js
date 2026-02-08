//단계 전환 가능 여부 검증 (트리거 관리)
import symptomGuideValidateService from '../services/symptomGuide_validate.service.js';
import { sendSuccess } from '../utils/response.util.js';

const validateGuideStep = async (req, res, next) => {
  try {
    const userId = BigInt(req.user.userID);
    const painAreaId = BigInt(req.params.painAreaId);
    const { fromStep, toStep } = req.body;

    const canMove =
      await symptomGuideValidateService.validateStepMove(
        userId,
        painAreaId,
        fromStep,
        toStep
      );

    return sendSuccess(
      res,
      { canMove },
      canMove ? '단계 이동 가능' : '단계 이동 불가',
      200
    );
  } catch (err) {
    next(err);
  }
};

export default {
  validateGuideStep,
};