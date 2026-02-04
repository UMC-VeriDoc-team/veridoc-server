import HomeService from '../services/home.service.js';
import { sendSuccess } from '../utils/response.util.js';

// 로그인 및 증상 선택 후 홈 화면 관련 컨트롤러
class HomeController {
  constructor(service = new HomeService()) {
    this.service = service;
    this.getHome = this.getHome.bind(this);
    this.getDoctorAnswerSummary = this.getDoctorAnswerSummary.bind(this);
    this.getDoctorAnswerDetail = this.getDoctorAnswerDetail.bind(this);
  }

  // 홈 전체 불러오기
  async getHome(req, res, next) {
    try {
      const userId = req.user.userID;  // JWT 토큰에서 userID 추출
      const data = await this.service.getHomeData(userId);
      return sendSuccess(res, data, '홈 화면 조회 성공');
    } catch (err) {
      next(err);
    }
  }

  // 전문의 답변 요약본 조회
  async getDoctorAnswerSummary(req, res, next) {
    try {
      const userId = req.user.userID;
      const answerId = Number(req.params.answerId);
      const result = await this.service.getDoctorAnswerSummary(answerId, userId);
      
      return sendSuccess(res, result, '전문의 답변 요약 조회 성공');
    } catch (err) {
      next(err);
    }
  }

  // 전문의 답변 상세 조회
  async getDoctorAnswerDetail(req, res, next) {
    try {
      const userId = req.user.userID;
      const answerId = Number(req.params.answerId);
      const result = await this.service.getDoctorAnswerDetail(answerId, userId);
      
      return sendSuccess(res, result, '전문의 답변 조회 성공');
    } catch (err) {
      next(err);
    }
  }
}

export default HomeController;