import HomeService from '../services/home.service.js';

class HomeController {
  constructor(service = new HomeService()) {
    this.service = service;
    this.getHome = this.getHome.bind(this);
  }

  async getHome(req, res, next) {
    try {
      // 인증이 필요하면 Authorization 헤더 검사
      const auth = req.headers.authorization;
      if (!auth) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } });
      }

      const data = await this.service.getHomeData();
      return res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getDoctorAnswerSummary(req, res, next) {
    try {
      const auth = req.headers.authorization;
      if (!auth) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } });
      }
      const answerId = Number(req.params.answerId);
      const summary = await this.service.getDoctorAnswerSummary(answerId);
      if (!summary) {
        return res.status(404).json({ error: { code: 'CONTENT_NOT_FOUND', message: '요청하신 전문의 답변 요약본을 찾을 수 없습니다.' } });
      }
      return res.json({ data: summary });
    } catch (err) {
      next(err);
    }
  }
}

export default HomeController;