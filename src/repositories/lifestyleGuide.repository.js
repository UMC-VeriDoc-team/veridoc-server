import prisma from '../config/db.config.js';

class LifestyleGuideRepository {
  static async getLifestyleVideosByPainArea(painAreaId) {
    return prisma.lifestyle_videos.findMany({
      where: {
        symptoms: {
          pain_area_id: painAreaId,
        },
      },
    });
  }
}

export default LifestyleGuideRepository;