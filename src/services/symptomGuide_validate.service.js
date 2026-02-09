import symptomGuideRepository from '../repositories/symptomGuide.repository.js';

const validateStepMove = async (userId, painAreaId, fromStep, toStep) => {
  let canMove = false;

  // 1 → 2 : 항상 가능
  if (fromStep === 1 && toStep === 2) {
    canMove = true;
  }

  // 2 → 3 : 전문의 답변 확인 필요
  if (fromStep === 2 && toStep === 3) {
    canMove = await symptomGuideRepository.hasEvent(
      userId,
      painAreaId,
      'DOCTOR_OPINION_VIEWED'
    );
  }

  // 3 → 4 : 임시 대처 정보 확인 필요
  if (fromStep === 3 && toStep === 4) {
    canMove = await symptomGuideRepository.hasEvent(
      userId,
      painAreaId,
      'TREATMENT_INFO_VIEWED'
    );
  }

  // 이동 가능하면 진행 상태 업데이트
  if (canMove) {
    await symptomGuideRepository.updateProgress(userId, painAreaId, toStep);
  }

  return canMove;
};

export default {
  validateStepMove,
};