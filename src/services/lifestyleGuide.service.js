import prisma from '../config/db.config.js';

const PAIN_AREA_META = {
  1: { name: '어깨', source: '새움병원' },
  2: { name: '허리', source: '대찬병원' },
  3: { name: '무릎', source: '서울예스병원' },
  4: { name: '목', source: 'CM병원' },
  5: { name: '두통', source: '국제성모TV' },
  6: { name: '복통', source: '건강채 민트TV' },
};

class LifestyleGuideService {
  static async getLifestyleGuide(painAreaId) {
    const meta = PAIN_AREA_META[painAreaId];

    // 증상 미선택
    if (!painAreaId || !meta) {
      return {
        painAreaId: null,
        painAreaName: null,
        title: null,
        subtitle: null,
        videos: [],
      };
    }

    const videos = await prisma.lifestyle_videos.findMany({
      where: {
        pain_area_id: painAreaId,
      },
      select: {
        video_id: true,
        title: true,
        youtube_url: true,
        description: true,
      },
    });

    return {
      painAreaId,
      painAreaName: meta.name,
      title: `${meta.name} 스트레칭`,
      subtitle: `아래 영상은 ${meta.name} 불편 시 가볍게 참고할 수 있는 스트레칭 예시에요.`,
      videos: videos.map(video => ({
        videoId: Number(video.video_id),
        youtubeUrl: video.youtube_url,
        youtubeTitle: video.title,
        source: {
          name: meta.source,
        },
        description: video.description,
      })),
    };
  }
}

export default LifestyleGuideService;