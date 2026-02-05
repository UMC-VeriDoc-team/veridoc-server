import ApiError from "../errors/ApiError.js";
import errorCodes from "../errors/errorCodes.js";

class UserDTO {
  static userCreate(payload) {
    if(!payload){
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '요청 데이터가 없습니다.')
    }
    const { name, email, password, birth, gender, painAreaID } = payload
    
    // 모든 필수 항목을 입력하지 않았을 때
    if(!name || !email || !password || !birth || !gender){
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '모든 필수 항목을 입력해주세요.')
    }

    //이메일 형식이 올바르지 않을 때
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if(!emailRegex.test(email)){
      throw new ApiError(400, errorCodes.INVALID_EMAIL_FORMAT, '이메일 형식이 올바르지 않습니다.')
    }

    //비밀번호 형식이 올바르지 않을 때 (최소 8자, 영문,숫자,특수문자 포함으로 우선 형식 만들어놓음)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if(!passwordRegex.test(password)){
      throw new ApiError(400, errorCodes.INVALID_PASSWORD_FORMAT, '비밀번호 형식이 올바르지 않습니다.')
    }
    
    //생년월일 형식이 올바르지 않을 때
    const birthRegex = /^\d{4}-\d{2}-\d{2}$/
    if(!birthRegex.test(birth)){
      throw new ApiError(400, errorCodes.INVALID_BIRTHDATE_FORMAT, '생년월일 형식이 올바르지 않습니다.')
    }

    //실제 날짜인지 확인
    const date = new Date(birth)
    if(isNaN(date.getTime())){
      throw new ApiError(400, errorCodes.INVALID_BIRTHDATE_FORMAT, '생년월일 형식이 올바르지 않습니다.')
    }

    //painAreaID가 있다면 숫자인지만 체크(선택 안했을 수도 있음)
    if(painAreaID !== undefined && painAreaID !== null){
      if(Number.isNaN(Number(painAreaID))){
        throw new ApiError(400, errorCodes.INVALID_PAIN_AREA_ID_FORMAT, 'painAreaID는 숫자여야 합니다.')
      }
    }

    return {
      name,
      email,
      password,
      birth: new Date(birth),
      gender,
      painAreaID: painAreaID ? BigInt(painAreaID) : BigInt(8)
    }
  }
}

export default UserDTO;
