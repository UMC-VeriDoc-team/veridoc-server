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
      await LifestyleGuideRepository.findPainAreaWithLifestyleVideo(painAreaId);

    // 존재하지 않는 부위
    if (!painArea) {
      return {
        painAreaId: null,
        painAreaName: null,
        title: null,
        subtitle: null,
        videos: [],
      };
    }

    const video = painArea.lifestyle_videos[0]; // 부위당 1개 고정

    if (!video) {
      return {
        painAreaId: Number(painArea.pain_area_id),
        painAreaName: painArea.name,
        title: null,
        subtitle: null,
        videos: [],
      };
    }

    return {
      painAreaId: Number(painArea.pain_area_id),
      painAreaName: painArea.name,
      title: video.title,
      subtitle: video.subtitle,
      videos: [
        {
          videoId: Number(video.video_id),
          youtubeUrl: video.youtube_url,
          youtubeTitle: video.youtube_title,
          source: {
            name: video.source_name,
          },
          description: video.description,
        },
      ],
    };
  }
}

export default LifestyleGuideService;