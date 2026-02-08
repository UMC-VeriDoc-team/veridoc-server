import ExpertAnswerService from '../services/expertAnswer.service.js';
import { sendSuccess } from '../utils/response.util.js';

class ExpertAnswerController {
  constructor(service = new ExpertAnswerService()) {
    this.service = service;
    this.getDoctorAnswerSummary = this.getDoctorAnswerSummary.bind(this);
    this.getDoctorAnswerDetail = this.getDoctorAnswerDetail.bind(this);
    this.getAllAnswerIds = this.getAllAnswerIds.bind(this);
  }

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

  async getAllAnswerIds(req, res, next) {
    try {
      const answers = await this.service.getAllAnswerIds();
      return sendSuccess(res, { answers }, '전문의 답변 ID 조회 성공');
    } catch (err) {
      next(err);
    }
  }
}

export default ExpertAnswerController;
