//사용자 행동 이벤트 기록 (트리거 해제용)
import symptomGuideRepository from '../repositories/symptomGuide.repository.js';

const recordEvent = async (userId, painAreaId, event) => {
  const saved = await symptomGuideRepository.createEvent(
    userId,
    painAreaId,
    event
  );

  return {
    painAreaId: Number(saved.pain_area_id),
    event: saved.event_type,
    recordedAt: saved.created_at,
  };
};

export default {
  recordEvent,
};