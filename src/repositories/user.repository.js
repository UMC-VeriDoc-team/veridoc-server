import prisma from '../config/db.config.js';

class UserRepository {
  constructor(client = prisma) {
    this.client = client;
  }

  async findAll() {
    return this.client.user.findMany();
  }

  async findById(userID) {
    return this.client.user.findUnique({ where: { userID } });
  }

  async create(data) {
    return this.client.user.create({ data });
  }

  async update(userID, data) {
    return this.client.user.update({ where: { userID }, data });
  }

  async remove(userID) {
    return this.client.user.delete({ where: { userID } });
  }
}

export default UserRepository;
