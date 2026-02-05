/**
 * API 응답을 표준화하는 유틸리티
 */

const sanitizeData = (value) => {
  // BigInt 처리
  if (typeof value === 'bigint') {
    return value <= Number.MAX_SAFE_INTEGER ? Number(value) : value.toString();
  }

  // Date 처리
  if (value instanceof Date) {
    return value.toISOString();
  }

  // 배열 처리
  if (Array.isArray(value)) {
    return value.map(sanitizeData);
  }

  // 객체 처리
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, sanitizeData(val)])
    );
  }

  return value;
};

// 성공 응답
export const sendSuccess = (res, data = null, message = '요청이 완료되었습니다.', statusCode = 200) => {
  res.status(statusCode).json({
    code: statusCode,
    message,
    data: sanitizeData(data),
  });
};

// 실패 응답
export const sendError = (res, statusCode = 500, message = '오류가 발생했습니다.', errorCode = null) => {
  res.status(statusCode).json({
    code: statusCode,
    message,
    errorCode: errorCode || 'INTERNAL_SERVER_ERROR',
  });
};

// 자주 사용되는 인증 관련 응답들
export const sendAuthError = (res, message = '인증에 실패했습니다.') => {
  sendError(res, 401, message, 'UNAUTHORIZED');
};

export const sendValidationError = (res, message = '유효하지 않은 요청입니다.') => {
  sendError(res, 400, message, 'VALIDATION_ERROR');
};

export const sendNotFoundError = (res, message = '요청한 리소스를 찾을 수 없습니다.') => {
  sendError(res, 404, message, 'NOT_FOUND');
};

export const sendConflictError = (res, message = '이미 존재하는 리소스입니다.') => {
  sendError(res, 409, message, 'CONFLICT');
};
