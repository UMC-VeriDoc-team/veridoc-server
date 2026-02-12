import UserRepository from '../repositories/user.repository.js';
import UserDTO from '../dtos/user.dto.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';
import prisma from '../config/db.config.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generatePasswordResetToken, verifyPasswordResetToken } from '../utils/jwt.util.js';
import { sendPasswordResetEmail } from '../utils/email.util.js';
import emailConfig from '../config/email.config.js';

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

    //이메일 중복 체크 (활성 유저)
    const existingEmail = await this.repository.findByEmail(validatedData.email);
    if(existingEmail){
      throw new ApiError(409, errorCodes.EMAIL_ALREADY_EXISTS, '이미 가입된 이메일 주소입니다.')
    }

    // soft-deleted 유저 체크 (3일 재가입 제한)
    const deletedUser = await this.repository.findDeletedByEmail(validatedData.email);
    if (deletedUser) {
      const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
      const elapsed = Date.now() - new Date(deletedUser.deleted_at).getTime();

      if (elapsed < THREE_DAYS_MS) {
        throw new ApiError(409, errorCodes.ACCOUNT_RECENTLY_DELETED, '탈퇴 후 3일간 재가입이 불가능합니다.');
      }

      // 3일 초과 → 기존 레코드 hard delete
      await this.repository.hardRemove(Number(deletedUser.user_id));
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

    const { user_pain_areas, ...rest } = user;
    const painAreaID = user_pain_areas?.[0]?.pain_areas?.pain_area_id
      ? Number(user_pain_areas[0].pain_areas.pain_area_id)
      : 8;

    return { ...rest, painAreaID };
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

  // 비밀번호 재설정 요청
  async forgotPassword(email) {
    if (!email || email.trim() === '') {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '이메일을 입력해주세요.');
    }

    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new ApiError(404, errorCodes.USER_NOT_FOUND, '가입되지 않은 이메일입니다.');
    }

    const token = generatePasswordResetToken(Number(user.user_id), user.email, user.password);
    const resetUrl = `${emailConfig.passwordResetUrl}?token=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  }

  // 비밀번호 재설정
  async resetPassword(token, newPassword) {
    if (!token) {
      throw new ApiError(400, errorCodes.PASSWORD_RESET_TOKEN_INVALID, '토큰이 필요합니다.');
    }

    if (!newPassword) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '새 비밀번호를 입력해주세요.');
    }

    // 비밀번호 형식 검증
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])[^\s]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new ApiError(400, errorCodes.INVALID_PASSWORD_FORMAT, '비밀번호 형식이 올바르지 않습니다.');
    }

    // 토큰에서 userID를 먼저 추출 (서명 검증 없이 디코딩)
    const unverified = jwt.decode(token);
    if (!unverified || !unverified.userID) {
      throw new ApiError(400, errorCodes.PASSWORD_RESET_TOKEN_INVALID, '유효하지 않은 토큰입니다.');
    }

    const user = await this.repository.findById(unverified.userID);
    if (!user) {
      throw new ApiError(404, errorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
    }

    // 현재 비밀번호 해시를 포함한 시크릿으로 검증 (이미 사용된 토큰이면 실패)
    let decoded;
    try {
      decoded = verifyPasswordResetToken(token, user.password);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(400, errorCodes.PASSWORD_RESET_TOKEN_EXPIRED, '만료된 토큰입니다. 다시 요청해주세요.');
      }
      throw new ApiError(400, errorCodes.PASSWORD_RESET_TOKEN_INVALID, '유효하지 않은 토큰입니다.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.repository.update(decoded.userID, { password: hashedPassword });
  }

  // 마이페이지: 프로필 수정 (이름, 생년월일, 성별)
  async updateProfile(userID, payload) {
    const { name, birth, gender } = payload;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (birth !== undefined) updateData.birth = new Date(birth);
    if (gender !== undefined) {
      if (!['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
        throw new ApiError(400, errorCodes.VALIDATION_ERROR, '성별 값이 올바르지 않습니다.');
      }
      updateData.gender = gender;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '수정할 항목을 입력해주세요.');
    }

    await this.repository.update(userID, updateData);
  }

  // 마이페이지: 비밀번호 변경 (로그인 상태)
  async changePassword(userID, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.');
    }

    const user = await this.repository.findById(userID);
    if (!user) {
      throw new ApiError(404, errorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new ApiError(400, errorCodes.INVALID_CREDENTIALS, '현재 비밀번호가 올바르지 않습니다.');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])[^\s]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new ApiError(400, errorCodes.INVALID_PASSWORD_FORMAT, '비밀번호 형식이 올바르지 않습니다.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.repository.update(userID, { password: hashedPassword });
  }

  // 마이페이지: 주요 아픈 부위 변경
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