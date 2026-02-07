import symptomGuideRepository from '../repositories/symptomGuide.repository.js';

const validateStepMove = async (userId, painAreaId, fromStep, toStep) => {
  // 1 → 2 : 항상 가능
  if (fromStep === 1 && toStep === 2) {
    return true;
  }

  // 2 → 3 : 전문의 답변 확인 필요
  if (fromStep === 2 && toStep === 3) {
    return await symptomGuideRepository.hasEvent(
      userId,
      painAreaId,
      'DOCTOR_OPINION_VIEWED'
    );
  }

  // 3 → 4 : 임시 대처 정보 확인 필요
  if (fromStep === 3 && toStep === 4) {
    return await symptomGuideRepository.hasEvent(
      userId,
      painAreaId,
      'TREATMENT_INFO_VIEWED'
    );
  }

  // 그 외는 불가
  return false;
};

export default {
  validateStepMove,
};