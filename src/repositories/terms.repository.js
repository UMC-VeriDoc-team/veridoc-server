import prisma from '../config/db.config.js';

class TermsRepository {
  constructor(client = prisma) {
    this.client = client;
  }

  async upsertAgreement(userId, agreementData) {
    const now = new Date();

    return this.client.user_terms_agreements.upsert({
      where: { user_id: BigInt(userId) },
      create: {
        user_id: BigInt(userId),
        agreed_at: now,
        created_at: now,
        updated_at: now,
        ...agreementData,
      },
      update: {
        agreed_at: now,
        updated_at: now,
        ...agreementData,
      },
      select: {
        agreed_at: true,
      },
    });
  }
}

export default TermsRepository;
