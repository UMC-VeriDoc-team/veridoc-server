import UserRepository from '../repositories/user.repository.js';

class UserService {
  constructor(repository = new UserRepository()) {
    this.repository = repository;
  }

  async list() {
    return this.repository.findAll();
  }

  async findById(id) {
    return this.repository.findById(id);
  }

  async create(payload) {
    return this.repository.create(payload);
  }

  async update(id, payload) {
    return this.repository.update(id, payload);
  }

  async remove(id) {
    return this.repository.remove(id);
  }
}

export default UserService;
