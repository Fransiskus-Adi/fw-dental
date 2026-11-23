import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EventLogService } from '../logging/event-log.service';

@Injectable()
export class MailService {
  private readonly transporter?: nodemailer.Transporter;

  constructor(
    private readonly config: ConfigService,
    private readonly events: EventLogService,
  ) {
    const host = config.get<string>('SMTP_HOST');
    const port = Number(config.get('SMTP_PORT', '587'));
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host, port, secure: port === 465, requireTLS: port !== 465,
        auth: { user, pass },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
        disableFileAccess: true,
        disableUrlAccess: true,
      });
    } else {
      this.events.record({ event: 'mail.unconfigured', level: 'warn' });
    }
  }

  async sendPasswordResetEmail(email: string, link: string): Promise<void> {
    try {
      if (!this.transporter) throw new Error('SMTP is not configured');
      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM'),
        to: email,
        subject: 'FW Dental Portal password reset',
        text: `Reset your FW Dental Portal password using this link:\n\n${link}\n\nThe link expires in 30 minutes and can be used once. If you did not request a reset, you can ignore this message.`,
      });
      this.events.record({ event: 'mail.sent', level: 'info' });
    } catch (error) {
      this.events.record({
        event: 'mail.delivery_failed',
        level: 'error',
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
      });
      throw error;
    }
  }
}
