import prisma from '../config/db.config.js';

class LifestyleGuideRepository {
  static async findPainAreaWithLifestyleVideos(painAreaId) {
    return prisma.pain_areas.findUnique({
      where: {
        pain_area_id: BigInt(painAreaId),
      },
      select: {
        pain_area_id: true,
        name: true,
        source_name: true,
        lifestyle_videos: {
          where: {
            is_active: true,
          },
          select: {
            video_id: true,
            title: true,
            youtube_url: true,
            description: true,
          },
        },
      },
    });
  }
}

export default LifestyleGuideRepository;