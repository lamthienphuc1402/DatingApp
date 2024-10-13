import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'tpnightcore42@gmail.com', // Thay đổi với email của bạn
        pass: 'ztuomcdcfdvixocv', // Thay đổi với mật khẩu email của bạn
      },
    });
  }

  async sendVerificationEmail(email: string, code: string) {
    try {
      const mailOptions = {
        from: 'tpnightcore42@gmail.com',
        to: email,
        subject: 'Mã xác thực',
        text: `Mã xác thực của bạn là: ${code}`,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send verification email');
    }
  }
}