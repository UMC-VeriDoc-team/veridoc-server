import symptomGuideRepository from '../repositories/symptomGuide.repository.js';

const getGuide = async (userId, painAreaId) => {
  // 1. 해당 통증 부위의 가이드 step 조회
  const steps = await symptomGuideRepository.findStepsByPainArea(painAreaId);

  // 2️. 유저 진행 상태 조회 (없으면 null)
  const progress =
    await symptomGuideRepository.findUserProgress(userId, painAreaId);

  return {
    painAreaId: Number(painAreaId),
    steps: steps.map(step => ({
      step: step.step_number,
      title: step.title,
      subtitle: step.subtitle,
      caption: step.caption,
      description: step.description,
      imageUrl: step.image_url,
    })),
    userProgress: progress
      ? {
          currentStep: progress.current_step,
          lastVisitedAt: progress.last_visited_at,
        }
      : null,
  };
};

export default {
  getGuide,
};