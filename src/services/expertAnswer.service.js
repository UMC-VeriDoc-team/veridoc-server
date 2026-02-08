import HomeRepository from '../repositories/home.repository.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';

class ExpertAnswerService {
  constructor(repository = new HomeRepository()) {
    this.repository = repository;
  }

  validateAnswerId(answerId) {
    if (!answerId || isNaN(answerId)) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '유효한 답변 ID를 제공해주세요.');
    }
  }

  async getDoctorAnswerSummary(answerId, userId) {
    this.validateAnswerId(answerId);
    const answer = await this.repository.getExpertAnswerSummary(answerId, userId);
    if (answer?.notFound) {
      throw new ApiError(404, 'CONTENT_NOT_FOUND', '요청하신 전문의 답변을 찾을 수 없습니다.');
    }
    if (answer?.notMatchedSymptom) {
      throw new ApiError(404, 'NOT_MATCHED_SYMPTOM', '해당 증상에 대한 전문의 답변이 아닙니다.');
    }
    return answer;
  }

  async getDoctorAnswerDetail(answerId, userId) {
    this.validateAnswerId(answerId);
    const answer = await this.repository.getExpertAnswerSummary(answerId, userId);
    if (answer?.notFound) {
      throw new ApiError(404, 'CONTENT_NOT_FOUND', '요청하신 전문의 답변을 찾을 수 없습니다.');
    }
    if (answer?.notMatchedSymptom) {
      throw new ApiError(404, 'NOT_MATCHED_SYMPTOM', '해당 증상에 대한 전문의 답변이 아닙니다.');
    }
    // 상세 조회는 기존대로 repository.getExpertAnswerDetail 사용
    return await this.repository.getExpertAnswerDetail(answerId, userId);
  }

  async getAllAnswerIds() {
    return this.repository.getAllExpertAnswerIds();
  }
}

export default ExpertAnswerService;
