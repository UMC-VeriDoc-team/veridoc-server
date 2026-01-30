import { verifyMasterToken } from '../utils/jwt.util.js';
import { verifyAccessToken } from '../utils/jwt.util.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';
// 마스터 토큰의 요청을 통과시키기 위한 미들웨어.

/*
 일반 Access Token 과 마스터 JWT 모두 통과되도록 함
 일반 토큰 성공 시 req.user 에 payload 저장
 마스터 토큰 성공 시 req.master 에 payload 저장
*/
 export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if(!authHeader || !authHeader.startsWith('Bearer ')){
            throw new ApiError(401, errorCodes.UNAUTHORIZED, '인증 토큰이 필요합니다.')
        }
        const token = authHeader.split(' ')[1] // Bearer 토큰 분리

        // 일반 토큰(Access Token) 검증
        try {
            req.user = verifyAccessToken(token)
            return next()
        } catch(_){}

        // 마스터 토큰(Master Token) 검증
        try{
            req.master = verifyMasterToken(token)
            return next()
        } catch(_){}

        // 둘 다 실패 시 에러 발생
        throw new ApiError(401, errorCodes.UNAUTHORIZED, '유효하지 않은 토큰입니다.')
    } catch(err){
        next(err)
    }
 }