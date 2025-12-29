class ApiError extends Error {
  constructor(status = 500, code = 'INTERNAL_ERROR', message = 'Internal error', errors = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
  }

  toResponse() {
    const payload = {
      success: false,
      message: this.message || 'Error',
      data: null,
      code: this.code || 'INTERNAL_ERROR'
    };
    if (this.errors) payload.errors = this.errors;
    return payload;
  }
}

export default ApiError;
