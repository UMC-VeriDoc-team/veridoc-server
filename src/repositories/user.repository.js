import prisma from '../config/db.config.js';

class UserRepository {
  constructor(client = prisma) {
    this.client = client;
  }
 
  // 모든 유저 조회
  async findAll() {
    return this.client.users.findMany();
  }

  // userID로 유저 조회
  async findById(id) {
    return this.client.user.findUnique({ where: { userID : BigInt(id) } });
  }

  async findByEmail(email) {
    return this.client.user.findUnique({ where: { email } });
  }
 
  /*유저 생성 & painArea를 선택했다면 UserPainArea 까지 생성
    transaction 을 사용하여 두 테이블 모두 성공적으로 생성되었는지 확인
   */
  async create(data) {
    const {painAreaID, ...userData} = data
    
    return this.client.$transaction(async (tx) => {
      //user 테이블에 레코드 생성
      const user = await tx.user.create({ data: userData })

      //painArea를 선택했다면 UserPainArea 테이블에 레코드 생성
      if (painAreaID){
        await tx.userPainArea.create({
          data : {
            userID : user.userID,
            painAreaID : painAreaID
          }
        })
      }

      return user
    })
  }

  async update(userID, data) {
    return this.client.user.update({ where: { userID : BigInt(userID) }, data });
  }

  async remove(userID) {
    return this.client.user.delete({ where: { userID : BigInt(userID) } });
  }
}

export default UserRepository;
