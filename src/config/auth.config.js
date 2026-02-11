const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  adminApiKey: process.env.ADMIN_API_KEY,
};

export default authConfig;
