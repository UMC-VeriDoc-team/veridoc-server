import ApiError from '../errors/ApiError.js';

export default function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    const payload = err.toResponse();
    return res.status(err.status || 500).json(payload);
  }

  // Unknown error -> log and return generic response
  // Consider replacing console.error with `Logger.error` if available
  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    data: null,
    code: 'INTERNAL_ERROR'
  });
}
