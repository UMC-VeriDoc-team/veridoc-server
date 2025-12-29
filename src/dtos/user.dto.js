// Simple DTO / validation placeholder
// Replace with a real validation library (Joi, class-validator, etc.) as needed.

class UserDTO {
  static userCreate(payload) {
    if (!payload || !payload.email || !payload.password) {
      throw new Error('Validation failed: email and password required');
    }
    return {
      email: payload.email,
      name: payload.name || null,
      password: payload.password
    };
  }
}

export default UserDTO;
