import prisma from '../config/db.config.js';

class UserRepository {
  constructor(client = prisma) {
    this.client = client;
  }

  async findAll() {
    return this.client.user.findMany();
  }

  async findById(id) {
    return this.client.user.findUnique({ where: { id } });
  }

  async create(data) {
    return this.client.user.create({ data });
  }

  async update(id, data) {
    return this.client.user.update({ where: { id }, data });
  }

  async remove(id) {
    return this.client.user.delete({ where: { id } });
  }
}

export default UserRepository;
