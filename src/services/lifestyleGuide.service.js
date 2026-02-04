import LifestyleGuideRepository from '../repositories/lifestyleGuide.repository.js';

class LifestyleGuideService {
  static async getLifestyleGuide(painAreaId) {
    // 부위 미선택
    if (!painAreaId) {
      return {
        painAreaId: null,
        painAreaName: null,
        title: null,
        subtitle: null,
        videos: [],
      };
    }

    const painArea =
      await LifestyleGuideRepository.findPainAreaWithLifestyleVideos(painAreaId);

    // 존재하지 않는 painArea
    if (!painArea) {
      return {
        painAreaId: null,
        painAreaName: null,
        title: null,
        subtitle: null,
        videos: [],
      };
    }

    return {
      painAreaId: Number(painArea.pain_area_id),
      painAreaName: painArea.name,
      title: `${painArea.name} 스트레칭`,
      subtitle: `아래 영상은 ${painArea.name} 불편 시 가볍게 참고할 수 있는 스트레칭 예시에요.`,
      videos: painArea.lifestyle_videos.map(video => ({
        videoId: Number(video.video_id),
        youtubeUrl: video.youtube_url,
        youtubeTitle: video.title,
        source: {
          name: painArea.source_name,
        },
        description: video.description,
      })),
    };
  }
}

export default LifestyleGuideService;