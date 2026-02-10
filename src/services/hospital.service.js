import ApiError from '../errors/ApiError.js';
import errorCodes from '../errors/errorCodes.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const OPEN_API_BASE_URL = 'http://apis.data.go.kr/B552657/HsptlAsembySearchService';

// 키워드 매칭 시 잘못된 매칭 방지
// 예: "외과" 키워드가 "정형외과"를 매칭하지 않도록
const EXCLUDED_PREFIXES = {
  '외과': ['정형외과', '신경외과', '흉부외과', '성형외과', '안과'],
  '내과': ['정신건강의학과'],
  '신경': ['정신건강의학과'],
};

function matchKeyword(name, keyword) {
  if (!name.includes(keyword)) return false;

  const excludes = EXCLUDED_PREFIXES[keyword];
  if (excludes) {
    // 제외 목록에 있는 키워드가 포함되어 있으면 매칭 실패
    if (excludes.some(ex => name.includes(ex))) return false;
  }

  return true;
}

class HospitalService {
  /**
   * 공공데이터 API를 호출하여 사용자 위치 기준 가까운 병원 조회
   * @param {number} userLat - 사용자 위도
   * @param {number} userLng - 사용자 경도
   * @param {number} limit - 반환할 병원 수 (기본값 5)
   * @param {number|null} painAreaId - 아픈 부위 ID (필터링용, 선택)
   * @returns {Promise<Object>} 검색 결과
   */
  async findNearbyHospitals(userLat, userLng, limit = 3, painAreaId = null) {
    const apiKey = process.env.OPEN_API_SERVICE_KEY;

    if (!apiKey) {
      throw new ApiError(
        500,
        errorCodes.INTERNAL_ERROR,
        '공공데이터 API 키가 설정되지 않았습니다.'
      );
    }

    // painAreaId가 있으면 해당 진료과 키워드 조회
    let specialtyKeywords = [];
    if (painAreaId) {
      const specialties = await prisma.pain_area_specialties.findMany({
        where: { pain_area_id: BigInt(painAreaId) },
        select: { specialty_keyword: true }
      });
      specialtyKeywords = specialties.map(s => s.specialty_keyword);
    }

    // 필터링 시 더 많은 결과를 가져와서 필터 후 limit 맞춤
    const fetchLimit = painAreaId ? Math.max(limit * 30, 100) : limit;

    const url = new URL(`${OPEN_API_BASE_URL}/getHsptlMdcncLcinfoInqire`);
    url.searchParams.append('serviceKey', apiKey);
    url.searchParams.append('WGS84_LAT', userLat.toString());
    url.searchParams.append('WGS84_LON', userLng.toString());
    url.searchParams.append('numOfRows', fetchLimit.toString());
    url.searchParams.append('pageNo', '1');
    url.searchParams.append('_type', 'json');

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

      if (data.response?.header?.resultCode !== '00') {
        throw new ApiError(
          502,
          errorCodes.INTERNAL_ERROR,
          `공공데이터 API 오류: ${data.response?.header?.resultMsg || 'Unknown error'}`
        );
      }

      const items = data.response?.body?.items?.item || [];
      let hospitalList = Array.isArray(items) ? items : [items];

      // 진료과 필터링 적용 (병원 이름에서 진료과 키워드 검색)
      if (specialtyKeywords.length > 0) {
        hospitalList = hospitalList.filter(item => {
          const name = item.dutyName || '';
          return specialtyKeywords.some(keyword => matchKeyword(name, keyword));
        });
      }

      // limit 적용
      hospitalList = hospitalList.slice(0, limit);

      // 긴 키워드부터 매칭하도록 정렬 (정형외과 > 외과)
      const sortedKeywords = [...specialtyKeywords].sort((a, b) => b.length - a.length);

      const hospitals = hospitalList.map((item) => {
        // 매칭된 진료과 키워드 찾기
        let matchedSpecialty = null;
        if (sortedKeywords.length > 0) {
          const name = item.dutyName || '';
          matchedSpecialty = sortedKeywords.find(keyword => matchKeyword(name, keyword)) || null;
        }

        return {
          hospitalId: item.hpid,
          name: item.dutyName,
          category: item.dutyDivName || null,
          matchedSpecialty,
          address: item.dutyAddr,
          distanceMeters: Math.round(parseFloat(item.distance) * 1000),
          coordinate: {
            lat: parseFloat(item.wgs84Lat || item.latitude || item.lat) || null,
            lng: parseFloat(item.wgs84Lon || item.longitude || item.lon) || null
          },
          imageUrl: `https://veridoc-storage.s3.ap-northeast-2.amazonaws.com/hospital/hospital.png`, // 임시사진
          homepageUrl: item.dutyUrl || null
        };
      });

      return {
        searchContext: {
          center: { lat: userLat, lng: userLng },
          painAreaId: painAreaId || null
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
