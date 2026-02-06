import TemporaryGuideRepository from '../repositories/temporaryGuide.repository.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';

const GUIDE_META_BY_TYPE = {
  '스트레칭/찜질': {
    badges: ['통증 직후', '하루 1~2회'],
    duration: '평균 소요 시간 10분',
  },
  '생활 습관': {
    badges: ['작은 자세 변화', '하루 여러 회'],
    duration: '평균 소요 시간 1분',
  },
};

class TemporaryGuideService {
  constructor(repository = new TemporaryGuideRepository()) {
    this.repository = repository;
  }

  async getGuideDetail(guideId) {
    if (!guideId || Number.isNaN(Number(guideId))) {
      throw new ApiError(404, errorCodes.CONTENT_NOT_FOUND, '요청하신 임시 대처 가이드를 찾을 수 없습니다.');
    }

    const guide = await this.repository.findGuideById(guideId);
    if (!guide) {
      throw new ApiError(404, errorCodes.CONTENT_NOT_FOUND, '요청하신 임시 대처 가이드를 찾을 수 없습니다.');
    }

    const painAreaId = Number(guide.pain_areas?.pain_area_id ?? guide.pain_area_id);
    const painAreaName = guide.pain_areas?.name ?? null;
    const meta = GUIDE_META_BY_TYPE[guide.guide_type] || { badges: [], duration: null };

    const moreGuidesRaw = await this.repository.findMoreGuidesByPainArea(
      painAreaId,
      guide.guide_id,
      2
    );

    const morePosts = moreGuidesRaw.map(item => ({
      answerId: Number(item.guide_id),
      painAreaId: Number(item.pain_area_id),
      symptomId: null,
      title: item.title,
      imageUrl: item.image_url,
    }));

    return {
      painAreaId,
      painAreaName,
      symptomId: null,
      type: painAreaName ? `${painAreaName} · ${guide.guide_type}` : guide.guide_type,
      guideId: Number(guide.guide_id),
      title: guide.title,
      subtitle: null,
      imageUrl: guide.image_url,
      duration: meta.duration,
      sourceName: null,
      sourceUrl: null,
      highlighter: null,
      content: guide.content ? String(guide.content).replace(/\\n/g, '\n') : null,
      badges: meta.badges,
      notes: [],
      cautions: [],
      helps: [],
      morePosts,
    };
  }
}

export default TemporaryGuideService;
