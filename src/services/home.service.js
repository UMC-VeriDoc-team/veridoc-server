import HomeRepository from '../repositories/home.repository.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';

class HomeService {
  constructor(repository = new HomeRepository()) {
    this.repository = repository;
  }

  // 홈 화면 데이터 조회
  async getHomeData() {
    return this.repository.getHomeData();
  }

  // 전문의 답변 상세 조회
  async getDoctorAnswerDetail(answerId) {
    if (!answerId || isNaN(answerId)) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '유효한 답변 ID를 제공해주세요.');
    }

    const answer = await this.repository.getExpertAnswerDetail(answerId);
    
    if (!answer) {
      throw new ApiError(404, 'CONTENT_NOT_FOUND', '요청하신 전문의 답변을 찾을 수 없습니다.');
    }

    return answer;
  }
}

export default HomeService;