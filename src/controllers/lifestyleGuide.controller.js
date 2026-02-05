import LifestyleGuideService from '../services/lifestyleGuide.service.js';

class LifestyleGuideController {
  async getLifestyleGuide(req, res, next) {
    try {
      const { painAreaId } = req.params;

      const data = await LifestyleGuideService.getLifestyleGuide(
        Number(painAreaId)
      );

      res.status(200).json({
        code: 200,
        message: data.painAreaName
          ? `${data.painAreaName} 생활관리`
          : '증상 미선택',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default LifestyleGuideController;