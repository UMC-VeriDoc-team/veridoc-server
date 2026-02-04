import HomeRepository from '../repositories/home.repository.js';

class HomeService {
  constructor(repository = new HomeRepository()) {
    this.repository = repository;
  }

  // 홈 화면 데이터 조회
  async getHomeData() {
    return this.repository.getHomeData();
  }

  // 전문의 답변 요약본 조회
  async getDoctorAnswerSummary(answerId) {
    return this.repository.getExpertAnswer(answerId);
  }
}

export default HomeService;