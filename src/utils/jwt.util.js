import jwt from 'jsonwebtoken';
import authConfig from '../config/auth.config.js';

//JWT access token 생성
export const generateAccessToken = (userID , email) => {
    return jwt.sign(
        {userID,email},  // 토큰에 포함될 데이터
        authConfig.jwtSecret,  // env 파일에 있는 JWT_SECRET 값
        {expiresIn: '2h'} // 토큰 만료 시간 2시간으로 설정
    )
}

//JWT access token 검증
export const verifyAccessToken = (token) => {
    return jwt.verify(token, authConfig.jwtSecret);  // 검증한 뒤 토큰에 포함된 데이터 반환
}