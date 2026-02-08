import HomeRepository from '../repositories/home.repository.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';

class HomeService {
  constructor(repository = new HomeRepository()) {
    this.repository = repository;
  }

  // 답변 ID 검증
  validateAnswerId(answerId) {
    if (!answerId || isNaN(answerId)) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '유효한 답변 ID를 제공해주세요.');
    }
  }

  // 홈 화면 데이터 조회
  async getHomeData(userId) {
    return this.repository.getHomeData(userId);
  }

  // 전문의 답변 요약본 조회
  async getDoctorAnswerSummary(answerId, userId) {
    this.validateAnswerId(answerId);

    const answer = await this.repository.getExpertAnswerSummary(answerId, userId);
    
    if (!answer) {
      throw new ApiError(404, 'CONTENT_NOT_FOUND', '요청하신 전문의 답변을 찾을 수 없습니다.');
    }

    return answer;
  }

  // 전문의 답변 상세 조회
  async getDoctorAnswerDetail(answerId, userId) {
    this.validateAnswerId(answerId);

    const answer = await this.repository.getExpertAnswerDetail(answerId, userId);
    
    if (!answer) {
      throw new ApiError(404, 'CONTENT_NOT_FOUND', '요청하신 전문의 답변을 찾을 수 없습니다.');
    }

    return answer;
  }

  // 전문의 답변 ID 전체 조회 (테스트용)
  async getAllAnswerIds() {
    return this.repository.getAllExpertAnswerIds();
  }
}

export default HomeService;