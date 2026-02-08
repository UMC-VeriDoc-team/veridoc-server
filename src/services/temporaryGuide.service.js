import TemporaryGuideRepository from "../repositories/temporaryGuide.repository.js";
import ApiError from "../errors/ApiError.js";
import errorCodes from "../errors/errorCodes.js";



class TemporaryGuideService {
  constructor(repository = new TemporaryGuideRepository()) {
    this.repository = repository;
  }

  async getGuideIds() {
    const guides = await this.repository.findGuideIdList();

    return guides.map((guide) => ({
      guideId: Number(guide.guide_id),
      painAreaName: guide.pain_areas?.name ?? null,
    }));
  }

  async getGuideDetail(guideId) {
    if (!guideId || Number.isNaN(Number(guideId))) {
      throw new ApiError(404, errorCodes.CONTENT_NOT_FOUND, "요청하신 임시 대처 가이드를 찾을 수 없습니다.");
    }

    const guide = await this.repository.findGuideById(guideId);
    if (!guide) {
      throw new ApiError(404, errorCodes.CONTENT_NOT_FOUND, "요청하신 임시 대처 가이드를 찾을 수 없습니다.");
    }

    const painAreaId = Number(guide.pain_areas?.pain_area_id ?? guide.pain_area_id);
    const painAreaName = guide.pain_areas?.name ?? null;

    const moreGuidesRaw = await this.repository.findMoreGuidesByPainArea(
      painAreaId,
      guide.guide_id,
      2
    );

    const morePosts = moreGuidesRaw.map((item) => ({
      guideId: Number(item.guide_id),
      painAreaId: Number(item.pain_area_id),
      title: item.title,
      imageUrl: item.image_url,
    }));

    return {
      painAreaId,
      painAreaName,
      type: painAreaName ? `${painAreaName} · ${guide.guide_type}` : guide.guide_type,
      guideId: Number(guide.guide_id),
      title: guide.title,
      subtitle: guide.subtitle,
      imageUrl: guide.image_url,
      duration: guide.duration,
      sourceName: guide.source_name,
      sourceUrl: guide.source_url,
      highlighter: guide.highlighter,
      content: guide.content ? String(guide.content) : null,
      badges: (guide.badges || []).map(b => b.text),
      notes: (guide.notes || []).map(n => ({
        noteId: Number(n.note_id),
        imageUrl: n.image_url,
        bold: n.bold,
        text: n.text
      })),
      cautions: (guide.cautions || []).map(c => ({
        cautionId: Number(c.caution_id),
        iconUrl: c.icon_url,
        bold: c.bold,
        text: c.text
      })),
      helps: (guide.helps || []).map(h => ({
        helpId: Number(h.help_id),
        text: h.text
      })),
      morePosts,
    };
  }
}

export default TemporaryGuideService;
