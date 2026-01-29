import HospitalService from '../services/hospital.service.js';
import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';

class HospitalController {
  constructor(service = new HospitalService()) {
    this.service = service;
    this.getNearbyHospitals = this.getNearbyHospitals.bind(this);
  }

  /**
   * 사용자 위치 기준 가까운 병원 조회
   * GET /api/v1/hospital/nearby?lat=37.556&lng=126.923&limit=5
   */
  async getNearbyHospitals(req, res, next) {
    try {
      const { lat, lng, limit } = req.query;

      // 위도/경도 유효성 검사
      if (!lat || !lng) {
        throw new ApiError(
          400,
          errorCodes.INVALID_COORDINATES,
          'lat(위도)와 lng(경도)는 필수입니다.'
        );
      }

      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      // 위도/경도 숫자 변환 검사
      if (isNaN(userLat) || isNaN(userLng)) {
        throw new ApiError(
          400,
          errorCodes.INVALID_COORDINATES,
          'lat(위도)와 lng(경도)는 유효한 숫자여야 합니다.'
        );
      }

      // 위도 범위: -90 ~ 90, 경도 범위: -180 ~ 180
      if (userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
        throw new ApiError(
          400,
          errorCodes.INVALID_COORDINATES,
          '위도는 -90~90, 경도는 -180~180 범위여야 합니다.'
        );
      }

      // limit 유효성 검사 (기본값 3)
      let limitNum = 3;
      if (limit !== undefined) {
        limitNum = parseInt(limit, 10);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
          throw new ApiError(
            400,
            errorCodes.INVALID_LIMIT,
            'limit는 1~100 사이의 정수여야 합니다.'
          );
        }
      }

      const result = await this.service.findNearbyHospitals(userLat, userLng, limitNum);

      res.json({
        code: 200,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export default HospitalController;
