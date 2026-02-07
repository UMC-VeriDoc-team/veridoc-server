import nodemailer from 'nodemailer';
import emailConfig from '../config/email.config.js';

const transporter = nodemailer.createTransport(emailConfig.smtp);

export const sendPasswordResetEmail = async (to, resetUrl) => {
  const mailOptions = {
    from: emailConfig.from,
    to,
    subject: '[VeriDoc] 비밀번호 재설정',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Apple SD Gothic Neo', sans-serif;">
        <h2 style="color: #333;">비밀번호 재설정</h2>
        <p>아래 버튼을 클릭하여 비밀번호를 재설정해주세요.</p>
        <p>이 링크는 <strong>15분</strong> 후 만료됩니다.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #4A90D9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px;">
            비밀번호 재설정
          </a>
        </div>
        <p style="color: #888; font-size: 12px;">본인이 요청하지 않은 경우 이 이메일을 무시해주세요.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
