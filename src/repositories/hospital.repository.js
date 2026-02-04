import prisma from '../config/db.config.js';

class HospitalRepository {
  constructor(client = prisma) {
    this.client = client;
  }

  async findAll() {
    return this.client.hospital.findMany();
  }

  async findById(hospitalID) {
    return this.client.hospital.findUnique({ where: { hospitalID } });
  }

  async findByHpid(hpid) {
    return this.client.hospital.findUnique({ where: { hpid } });
  }

  /**
   * 모든 병원 목록 조회 (거리 계산용)
   * 거리 계산은 Service 레이어에서 수행
   */
  async findAllWithCoordinates() {
    return this.client.hospital.findMany({
      select: {
        hospitalID: true,
        hpid: true,
        name: true,
        address: true,
        lat: true,
        lng: true,
        tel: true,
        homepageUrl: true
      }
    });
  }

  async create(data) {
    return this.client.hospital.create({ data });
  }

  async update(hospitalID, data) {
    return this.client.hospital.update({ where: { hospitalID }, data });
  }

  async upsertByHpid(hpid, data) {
    return this.client.hospital.upsert({
      where: { hpid },
      update: data,
      create: { hpid, ...data }
    });
  }

  async remove(hospitalID) {
    return this.client.hospital.delete({ where: { hospitalID } });
  }
}

export default HospitalRepository;
