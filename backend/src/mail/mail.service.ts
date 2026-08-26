import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress = '';

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    this.fromAddress = this.configService.get<string>('SMTP_FROM', '"FW Dental" <noreply@fwdental.com>');

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465, // true for 465, false for other ports like 587
          auth: {
            user,
            pass,
          },
        });
        this.logger.log('Nodemailer SMTP Transporter initialized successfully');
      } catch (err) {
        this.logger.error('Failed to initialize Nodemailer SMTP Transporter:', err);
      }
    } else {
      this.logger.warn(
        'SMTP settings are missing. MailService will run in simulated fallback mode.',
      );
    }
  }

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        `[SIMULATION/FALLBACK] Generated OTP for email ${email}: [ ${otp} ] (Expires in 5 minutes)`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject: 'FW Dental Portal - Password Reset OTP Verification Code',
        text: `Your OTP verification code for resetting your password is: ${otp}. This code will expire in 5 minutes.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>FW Dental - Forgot Password Request</h2>
            <p>You requested a verification code to reset your password. Please use the following 4-digit code:</p>
            <div style="font-size: 24px; font-weight: bold; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; text-align: center; width: 150px; margin: 20px 0; color: #16a34a; letter-spacing: 0.1em; border-radius: 8px;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
            <p style="color: #999; font-size: 12px;">If you did not request this code, you can safely ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(`Successfully sent OTP email to ${email}`);
    } catch (err: any) {
      this.logger.error(`Failed to send OTP email to ${email}:`, err);
      throw new InternalServerErrorException(`Failed to send OTP email: ${err.message || err}`);
    }
  }
}
