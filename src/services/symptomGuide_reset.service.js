//진행 상태 초기화
import symptomGuideRepository from '../repositories/symptomGuide.repository.js';

const resetGuide = async (userId, painAreaId) => {
  // 이벤트 기록 전부 삭제
  await symptomGuideRepository.clearEvents(userId, painAreaId);

  // 진행 상태 초기화
  const progress = await symptomGuideRepository.resetProgress(
    userId,
    painAreaId
  );

  return {
    painAreaId: Number(painAreaId),
    progress: {
      currentStep: progress.current_step,
      resetAt: progress.last_visited_at,
    },
  };
};

export default {
  resetGuide,
};