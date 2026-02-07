import symptomGuideEventsService from '../services/symptomGuide_events.service.js';
import { sendSuccess } from '../utils/response.util.js';

const recordGuideEvent = async (req, res, next) => {
  try {
    const userId = BigInt(req.user.userID);
    const painAreaId = BigInt(req.params.painAreaId);
    const { event } = req.body;

    const result = await symptomGuideEventsService.recordEvent(
      userId,
      painAreaId,
      event
    );

    return sendSuccess(
      res,
      result,
      '이벤트 기록 성공',
      200
    );
  } catch (err) {
    next(err);
  }
};

export default {
  recordGuideEvent,
};