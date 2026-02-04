import prisma from '../config/db.config.js';

class UserRepository {
  constructor(client = prisma) {
    this.client = client;
  }

  async findAll() {
    return this.client.users.findMany();
  }

  async findById(id) {
    // Prisma model uses BigInt for user_id
    return this.client.users.findUnique({ where: { user_id: BigInt(id) } });
  }

  async create(data) {
    return this.client.users.create({ data });
  }

  async update(id, data) {
    return this.client.users.update({ where: { user_id: BigInt(id) }, data });
  }

  async remove(id) {
    return this.client.users.delete({ where: { user_id: BigInt(id) } });
  }
}

export default UserRepository;
