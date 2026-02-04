import HomeService from '../services/home.service.js';
import { sendSuccess, sendAuthError, sendNotFoundError } from '../utils/response.util.js';

// 로그인 및 증상 선택 후 홈 화면 관련 컨트롤러
class HomeController {
  constructor(service = new HomeService()) {
    this.service = service;
    this.getHome = this.getHome.bind(this);
    this.getDoctorAnswerDetail = this.getDoctorAnswerDetail.bind(this);
  }

  // 홈 전체 불러오기
  async getHome(req, res, next) {
    try {
      // 인증이 필요하면 Authorization 헤더 검사
      const auth = req.headers.authorization;
      if (!auth) {
        return sendAuthError(res, '로그인이 필요합니다.');
      }

      const data = await this.service.getHomeData();
      return sendSuccess(res, data, '홈 화면 조회 성공');
    } catch (err) {
      next(err);
    }
  }

  // 전문의 답변 상세 조회
  async getDoctorAnswerDetail(req, res, next) {
    try {
      const auth = req.headers.authorization;
      if (!auth) {
        return sendAuthError(res, '로그인이 필요합니다.');
      }

      const answerId = Number(req.params.answerId);
      const result = await this.service.getDoctorAnswerDetail(answerId);
      
      return sendSuccess(res, result, '전문의 답변 조회 성공');
    } catch (err) {
      next(err);
    }
  }
}

export default HomeController;