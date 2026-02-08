import prisma from '../config/db.config.js';

class LifestyleGuideRepository {
  static async findPainAreaWithLifestyleVideo(painAreaId) {
    return prisma.pain_areas.findUnique({
      where: {
        pain_area_id: BigInt(painAreaId),
      },
      select: {
        pain_area_id: true,
        name: true,
        lifestyle_videos: {
          select: {
            video_id: true,
            title: true,
            subtitle: true,
            youtube_url: true,
            youtube_title: true,
            source_name: true,
            description: true,
          },
        },
      },
    });
  }
}

export default LifestyleGuideRepository;