import UserRepository from '../repositories/user.repository.js';
import UserDTO from '../dtos/user.dto.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';
import prisma from '../config/db.config.js';
import bcrypt from 'bcrypt';
import { generateAccessToken } from '../utils/jwt.util.js';

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
      const painArea = await prisma.pain_areas.findUnique({ where: { pain_area_id : validatedData.painAreaID } });

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
      userID : Number(createdUser.user_id),
      email : createdUser.email,
    }
  }

  // 유저 정보 수정
  async update(id, payload) {
    // 수정된 비밀번호 해싱
    if(payload.password){
      payload = {...payload, password: await bcrypt.hash(payload.password, 10)}
    }

    // 생년월일 형식 변환
    if(payload.birth){
      payload = {...payload, birth: new Date(payload.birth)}
    }
    return this.repository.update(id, payload);
  }
  
  // 유저 삭제
  async remove(id) {
    return this.repository.remove(id);
  }

  // 로그인
  async login(payload) {
    try {
      const { email, password } = payload

      // 이메일과 비밀번호 입력 여부 확인
      if(!email || !password || email.trim() === '' || password.trim() === ''){
        throw new ApiError(400, errorCodes.INVALID_REQUEST, '이메일과 비밀번호를 모두 입력해주세요.')
      }
      // 이메일로 사용자 조회
      const user = await this.repository.findByEmail(email)

      //사용자가 존재하지 않는 경우 (둘 중 무엇이 틀렸는지 구분 x)
      if(!user){
        throw new ApiError(401, errorCodes.INVALID_CREDENTIALS, '이메일 또는 비밀번호가 올바르지 않습니다.')
      }
      
      //비밀번호 검증
      const isPasswordValid = await bcrypt.compare(password, user.password)

      //비밀번호가 일치하지 않는 경우
      if(!isPasswordValid){
        throw new ApiError(401, errorCodes.INVALID_CREDENTIALS, '이메일 또는 비밀번호가 올바르지 않습니다.')
      }

      //access token 생성
      const accessToken = generateAccessToken(Number(user.user_id), user.email)

      // userID와 accessToken 반환
      return {
        userID : Number(user.user_id),
        accessToken : accessToken
      }
    } catch (err) {
      if(err instanceof ApiError){
        throw err
      }

      throw new ApiError(500, errorCodes.INTERNAL_SERVER_ERROR, '로그인 처리 중 서버 오류가 발생했습니다.')
    }
  }

  // 마이페이지: 내 정보 조회
  async getMe(userID) {
    const user = await this.repository.findMe(userID);
    if (!user) {
      throw new ApiError(404, errorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
    }
    return user;
  }

  // 마이페이지: 내 정보 수정
  async updateMe(userID, payload) {
    if(payload.password){
      payload = {...payload, password: await bcrypt.hash(payload.password, 10)}
    }
    if(payload.birth){
      payload = {...payload, birth: new Date(payload.birth)}
    }
    return this.repository.update(userID, payload);
  }

  // 마이페이지: 주요 아픈 부위 저장
  async updatePainArea(userID, painAreaID) {
    // painAreaID 존재 여부 확인
    const painArea = await this.repository.findPainAreaById(painAreaID);
    if (!painArea) {
      throw new ApiError(400, errorCodes.PAINAREA_NOT_FOUND, '존재하지 않는 아픈 부위입니다.');
    }

    // 기존 painArea 매핑 삭제
    await this.repository.clearUserPainArea(userID);

    // 새로운 painArea 매핑 생성
    await this.repository.createUserPainArea(userID, painAreaID);

    return { painAreaID: Number(painArea.pain_area_id), name: painArea.name };
  }
}

export default UserService