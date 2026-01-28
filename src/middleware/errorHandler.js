import ApiError from '../errors/ApiError.js';

export default function errorHandler(err, req, res, next) {
  // Error Response로 이미 정해놓은 에러의 경우
  if (err instanceof ApiError) {
    const payload = err.toResponse();
    return res.status(err.status || 500).json(payload);
  }

  // 그 외 에러의 경우
  console.error(err);
  return res.status(500).json({
    code : 'INTERNAL_SERVER_ERROR',
    message : 'Internal server error',
    data : null
  })
}
