import ApiError from "../errors/ApiError.js";
import errorCodes from "../errors/errorCodes.js";

class AnswerDTO {
  // 답변 ID 검증 (조회 시)
  static validateAnswerId(answerId) {
    if (!answerId) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '답변 ID가 없습니다.');
    }

    if (Number.isNaN(Number(answerId))) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '답변 ID는 숫자여야 합니다.');
    }

    return Number(answerId);
  }

  // 새 답변 생성 검증
  static createAnswer(payload) {
    if (!payload) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '요청 데이터가 없습니다.');
    }

    const { symptomId, summary, fullContent, sourceUrl } = payload;

    // 필수 항목 검증
    if (!symptomId || !summary || !fullContent) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '증상ID, 요약, 전체 내용은 필수입니다.');
    }

    // symptomId 검증
    if (Number.isNaN(Number(symptomId))) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '증상 ID는 숫자여야 합니다.');
    }

    // summary 검증 (최소 10자, 최대 500자)
    if (typeof summary !== 'string' || summary.trim().length < 10 || summary.length > 500) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '요약은 10자 이상 500자 이하여야 합니다.');
    }

    // fullContent 검증 (최소 50자, 최대 5000자)
    if (typeof fullContent !== 'string' || fullContent.trim().length < 50 || fullContent.length > 5000) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '전체 내용은 50자 이상 5000자 이하여야 합니다.');
    }

    // sourceUrl 검증 (있다면 URL 형식 확인)
    if (sourceUrl !== undefined && sourceUrl !== null && sourceUrl !== '') {
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlRegex.test(sourceUrl)) {
        throw new ApiError(400, errorCodes.VALIDATION_ERROR, 'sourceUrl은 유효한 URL 형식이어야 합니다.');
      }
    }

    return {
      symptomId: Number(symptomId),
      summary: summary.trim(),
      fullContent: fullContent.trim(),
      sourceUrl: sourceUrl ? sourceUrl.trim() : null
    };
  }

  // 답변 수정 검증
  static updateAnswer(answerId, payload) {
    if (!answerId) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '답변 ID가 없습니다.');
    }

    if (Number.isNaN(Number(answerId))) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '답변 ID는 숫자여야 합니다.');
    }

    if (!payload) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '요청 데이터가 없습니다.');
    }

    const { symptomId, summary, fullContent, sourceUrl } = payload;

    // 최소 하나의 필드는 있어야 함
    if (!symptomId && !summary && !fullContent && sourceUrl === undefined) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, '수정할 데이터가 없습니다.');
    }

    // symptomId 검증
    if (symptomId !== undefined && symptomId !== null) {
      if (Number.isNaN(Number(symptomId))) {
        throw new ApiError(400, errorCodes.VALIDATION_ERROR, '증상 ID는 숫자여야 합니다.');
      }
    }

    // summary 검증
    if (summary !== undefined && summary !== null) {
      if (typeof summary !== 'string' || summary.trim().length < 10 || summary.length > 500) {
        throw new ApiError(400, errorCodes.VALIDATION_ERROR, '요약은 10자 이상 500자 이하여야 합니다.');
      }
    }

    // fullContent 검증
    if (fullContent !== undefined && fullContent !== null) {
      if (typeof fullContent !== 'string' || fullContent.trim().length < 50 || fullContent.length > 5000) {
        throw new ApiError(400, errorCodes.VALIDATION_ERROR, '전체 내용은 50자 이상 5000자 이하여야 합니다.');
      }
    }

    // sourceUrl 검증
    if (sourceUrl !== undefined && sourceUrl !== null && sourceUrl !== '') {
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlRegex.test(sourceUrl)) {
        throw new ApiError(400, errorCodes.VALIDATION_ERROR, 'sourceUrl은 유효한 URL 형식이어야 합니다.');
      }
    }

    const updateData = {};
    if (symptomId !== undefined && symptomId !== null) updateData.symptomId = Number(symptomId);
    if (summary !== undefined && summary !== null) updateData.summary = summary.trim();
    if (fullContent !== undefined && fullContent !== null) updateData.fullContent = fullContent.trim();
    if (sourceUrl !== undefined) updateData.sourceUrl = sourceUrl ? sourceUrl.trim() : null;

    return {
      answerId: Number(answerId),
      ...updateData
    };
  }
}

export default AnswerDTO;
