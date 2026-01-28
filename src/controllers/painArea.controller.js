import PainAreaService from '../services/painArea.service.js';
import ApiError from '../errors/ApiError.js';

class PainAreaController {
    constructor(service = new PainAreaService()) {
        this.service = service
        this.listPainAreas = this.listPainAreas.bind(this)
    }

    async listPainAreas(req, res, next) {
        try {
            const painAreas = await this.service.list()

            return res.status(200).json({
                code : 200,
                message : '주요 아픈 부위 목록 조회 성공',
                data : {painAreas},
            })
        } catch(err) {
            // next로 넘기면 errorHandler 가 정해진 응답 형태로 통일해줌
            return next(
                err instanceof ApiError ? err : new ApiError(500, errorCodes.INTERNAL_ERROR, '주요 아픈 부위 목록 조회 실패')
            )
        }
    }
}

export default PainAreaController;