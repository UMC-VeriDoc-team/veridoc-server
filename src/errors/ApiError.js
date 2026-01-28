class ApiError extends Error {
  constructor(status = 500, code = 'INTERNAL_ERROR', message = 'Internal error', errors = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
  
  // 응답 양식 code, message, data 로 통일일
  toResponse() {
    return {
      code : this.code || 'INTERNAL_ERROR',
      message : this.message || 'Internal error',
      data : null
    }
  }
}

export default ApiError;
