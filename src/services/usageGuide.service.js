import UsageGuideRepository from '../repositories/usageGuide.repository.js';

class UsageGuideService {
  constructor(repository = new UsageGuideRepository()) {
    this.repository = repository;
  }

  async getSourceLinks() {
    const guides = await this.repository.findAllActive();
    return guides.map((g) => ({
      guideId: Number(g.guide_id),
      cardNumber: g.card_number,
      title: g.title,
      sourceUrl: g.source_url,
    }));
  }
}

export default UsageGuideService;
