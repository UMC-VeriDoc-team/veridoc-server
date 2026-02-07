import dotenv from 'dotenv';
dotenv.config();

const emailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  from: process.env.EMAIL_FROM || process.env.SMTP_USER,
  passwordResetUrl: process.env.PASSWORD_RESET_URL || 'http://localhost:5173/reset-password',
};

export default emailConfig;
