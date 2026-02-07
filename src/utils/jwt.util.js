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

// 마스터 JWT 생성 (관리자/시스템용, MASTER_JWT_SECRET 사용)
export const generateMasterToken = (payload = {}, options = {}) => {
    const defaultPayload = { type: 'master', ...payload };  //type을 master로 설정해 마스터 토큰임을 명시
    return jwt.sign(
        defaultPayload,
        authConfig.masterJwtSecret,
        { expiresIn: options.expiresIn ?? '24h', ...options }
    );
};

// 마스터 JWT 검증
export const verifyMasterToken = (token) => {
    return jwt.verify(token, authConfig.masterJwtSecret);
};

// 비밀번호 리셋 토큰 생성 (15분 만료)
export const generatePasswordResetToken = (userID, email) => {
    return jwt.sign(
        { userID, email, type: 'password-reset' },
        authConfig.jwtSecret,
        { expiresIn: '15m' }
    );
};

// 비밀번호 리셋 토큰 검증
export const verifyPasswordResetToken = (token) => {
    const decoded = jwt.verify(token, authConfig.jwtSecret);
    if (decoded.type !== 'password-reset') {
        throw new Error('Invalid token type');
    }
    return decoded;
};
