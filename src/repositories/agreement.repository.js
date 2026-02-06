import prisma from '../config/db.config.js';

class AgreementRepository {
  constructor(client) {
    this.client = client || prisma;
  }

  async findByUserId(userID) {
    return this.client.user_agreements.findMany({
      where: { user_id: BigInt(userID) },
      select: {
        agreement_type: true,
        agreed_at: true,
      },
    });
  }

  async createMany(userID, agreementTypes) {
    const userId = BigInt(userID);
    const now = new Date();

    return this.client.$transaction(async (tx) => {
      const results = [];
      for (const type of agreementTypes) {
        const record = await tx.user_agreements.upsert({
          where: {
            user_id_agreement_type: {
              user_id: userId,
              agreement_type: type,
            },
          },
          update: { agreed_at: now },
          create: {
            user_id: userId,
            agreement_type: type,
            agreed_at: now,
          },
        });
        results.push(record);
      }
      return { results, agreedAt: now };
    });
  }
}

export default AgreementRepository;