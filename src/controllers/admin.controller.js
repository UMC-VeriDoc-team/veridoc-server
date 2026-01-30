import { generateMasterToken } from '../utils/jwt.util.js';
import authConfig from '../config/auth.config.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';

class AdminController {
    async issueMasterToken(req, res, next) {  // util에 generateMasterToken 함수가 있으므로 이름만 다르게 함
        try {
            const { apiKey } = req.body;
            
            // API 키가 없거나 서버의 ADMIN_API_KEY와 다를 때
            if (!apiKey || apiKey !== authConfig.adminApiKey) {
                throw new ApiError(401, errorCodes.UNAUTHORIZED, '유효한 API 키가 아닙니다');
            }

            const masterToken = generateMasterToken(
                {subject : 'admin'},
                {expiresIn : '24h'}
            )

            res.status(200).json({code: 200, message: '마스터 토큰 발급 성공', data: {masterToken}});
        } catch (err) {
            next(err);
        }
    }
}

export default AdminController;