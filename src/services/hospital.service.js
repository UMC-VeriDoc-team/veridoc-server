import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';

const OPEN_API_BASE_URL = 'http://apis.data.go.kr/B552657/HsptlAsembySearchService';

class HospitalService {
  /**
   * 공공데이터 API를 호출하여 사용자 위치 기준 가까운 병원 조회
   * @param {number} userLat - 사용자 위도
   * @param {number} userLng - 사용자 경도
   * @param {number} limit - 반환할 병원 수 (기본값 5)
   * @returns {Promise<Object>} 검색 결과
   */
  async findNearbyHospitals(userLat, userLng, limit = 5) {
    const apiKey = process.env.OPEN_API_SERVICE_KEY;

    if (!apiKey) {
      throw new ApiError(
        500,
        errorCodes.INTERNAL_ERROR,
        '공공데이터 API 키가 설정되지 않았습니다.'
      );
    }

    const url = new URL(`${OPEN_API_BASE_URL}/getHsptlMdcncLcinfoInqire`);
    url.searchParams.append('serviceKey', apiKey);
    url.searchParams.append('WGS84_LAT', userLat.toString());
    url.searchParams.append('WGS84_LON', userLng.toString());
    url.searchParams.append('numOfRows', limit.toString());
    url.searchParams.append('pageNo', '1');
    url.searchParams.append('_type', 'json'); // JSON 응답 요청

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new ApiError(
          502,
          errorCodes.INTERNAL_ERROR,
          '공공데이터 API 호출에 실패했습니다.'
        );
      }

      const data = await response.json();

      // API 응답 검증
      if (data.response?.header?.resultCode !== '00') {
        throw new ApiError(
          502,
          errorCodes.INTERNAL_ERROR,
          `공공데이터 API 오류: ${data.response?.header?.resultMsg || 'Unknown error'}`
        );
      }

      const items = data.response?.body?.items?.item || [];

      // 배열이 아닌 경우 (결과가 1개일 때) 배열로 변환
      const hospitalList = Array.isArray(items) ? items : [items];

      const hospitals = hospitalList.map((item) => ({
        hospitalId: item.hpid,
        name: item.dutyName,
        category: item.dutyDivName || null,
        address: item.dutyAddr,
        distanceMeters: Math.round(parseFloat(item.distance) * 1000), // km → m 변환
        coordinate: {
          lat: parseFloat(item.wgs84Lat || item.latitude || item.lat) || null,
          lng: parseFloat(item.wgs84Lon || item.longitude || item.lon) || null
        },
        imageUrl: null, // 공공데이터 API에서 제공하지 않음
        homepageUrl: item.dutyUrl || null
      }));

      return {
        searchContext: {
          center: { lat: userLat, lng: userLng }
        },
        hospitals
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        502,
        errorCodes.INTERNAL_ERROR,
        `공공데이터 API 호출 중 오류 발생: ${error.message}`
      );
    }
  }
}

export default HospitalService;
