import prisma from '../config/db.config.js';

class UsageGuideRepository {
  constructor(client = prisma) {
    this.client = client;
  }

  async findAllActive() {
    return this.client.usage_guides.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
      select: {
        guide_id: true,
        card_number: true,
        title: true,
        source_url: true,
      },
    });
  }
}

export default UsageGuideRepository;
