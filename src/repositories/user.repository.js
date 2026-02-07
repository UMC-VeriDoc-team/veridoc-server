import prisma from '../config/db.config.js';

class UserRepository {
  constructor(client) {
    // prisma가 undefined일 경우를 대비해 직접 import
    if (client) {
      this.client = client;
    } else {
      this.client = prisma;
    }
    
    // 디버깅: client가 제대로 설정되었는지 확인
    if (!this.client) {
      throw new Error('Prisma client is not initialized');
    }
    if (!this.client.users) {
      throw new Error('Prisma client.users is not available. Make sure to run: npx prisma generate');
    }
  }

  // 모든 유저 조회
  async findAll() {
    return this.client.users.findMany();
  }

  // userID로 유저 조회
  async findById(id) {
    return this.client.users.findUnique({ where: { user_id: BigInt(id) } });
  }

  async findByEmail(email) {
    return this.client.users.findUnique({ where: { email } });
  }

  /*유저 생성 & painArea를 선택했다면 UserPainArea 까지 생성
    transaction 을 사용하여 두 테이블 모두 성공적으로 생성되었는지 확인
   */
  async create(data) {
    const { painAreaID, ...userData } = data

    return this.client.$transaction(async (tx) => {
      //user 테이블에 레코드 생성
      const user = await tx.users.create({ data: userData })

      //painArea를 선택했다면 user_pain_areas 테이블에 레코드 생성
      if (painAreaID) {
        await tx.user_pain_areas.create({
          data: {
            user_id: user.user_id,
            pain_area_id: painAreaID
          }
        })
      }

      return user
    })
  }

  async update(userID, data) {
    return this.client.users.update({ where: { user_id: BigInt(userID) }, data });
  }

  async remove(userID) {
    const userId = BigInt(userID);

    return this.client.$transaction(async (tx) => {
      // 관련 user_pain_areas 레코드 먼저 삭제
      await tx.user_pain_areas.deleteMany({ where: { user_id: userId } });

      // 관련 user_symptoms 레코드 삭제
      await tx.user_symptoms.deleteMany({ where: { user_id: userId } });

      // 관련 user_agreements 레코드 삭제
      await tx.user_agreements.deleteMany({ where: { user_id: userId } });

      // 유저 삭제
      return tx.users.delete({ where: { user_id: userId } });
    });
  }
  
    // 마이페이지: 유저 + painArea(있으면) 함께 조회
    async findMe(userID) {
      const userId = BigInt(userID);
  
      return this.client.users.findUnique({
        where: { user_id: userId },
        select: {
          user_id: true,
          name: true,
          email: true,
          birth: true,
          gender: true,
          user_pain_areas: {
            select: {
              pain_areas: {
                select: {
                  pain_area_id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    }
  
    // painArea 존재 확인
    async findPainAreaById(painAreaID) {
      return this.client.pain_areas.findUnique({
        where: { pain_area_id: BigInt(painAreaID) },
        select: { pain_area_id: true, name: true },
      });
    }
  
    // 유저의 painArea 매핑 삭제(해제)
    async clearUserPainArea(userID) {
      return this.client.user_pain_areas.deleteMany({
        where: { user_id: BigInt(userID) },
      });
    }
  
    // 유저의 painArea 매핑 생성(저장)
    async createUserPainArea(userID, painAreaID) {
      return this.client.user_pain_areas.create({
        data: {
          user_id: BigInt(userID),
          pain_area_id: BigInt(painAreaID),
        },
      });
    }

}

export default UserRepository;
