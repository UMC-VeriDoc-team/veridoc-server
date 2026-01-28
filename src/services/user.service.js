import UserRepository from '../repositories/user.repository.js';
import UserDTO from '../dtos/user.dto.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';
import prisma from '../config/db.config.js';
import bcrypt from 'bcrypt';

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
    // 입력 검증 & 변환
    const validatedData = UserDTO.userCreate(payload);

    //이메일 중복 체크
    const existingEmail = await this.repository.findByEmail(validatedData.email);
    if(existingEmail){
      throw new ApiError(409, errorCodes.EMAIL_ALREADY_EXISTS, '이미 가입된 이메일 주소입니다.')
    }

    //painAreaID 존재 여부 확인
    if(validatedData.painAreaID){
      const painArea = await prisma.painArea.findUnique({ where: { painAreaID : validatedData.painAreaID } });

      if (!painArea){
        throw new ApiError(400, errorCodes.PAINAREA_NOT_FOUND, '존재하지 않는 아픈 부위입니다.')
      }
    }

    //비밀번호 해싱
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    //해싱된 비밀번호 저장
    const createdUser = await this.repository.create({
      ...validatedData,
      password : hashedPassword
    });

    //응답용 데이터 반환
    return {
      userID : Number(createdUser.userID),
      email : createdUser.email
    }
  }

  async update(id, payload) {
    return this.repository.update(id, payload);
  }

  async remove(id) {
    return this.repository.remove(id);
  }
}

export default UserService;
