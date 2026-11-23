import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventLogService } from '../logging/event-log.service';
import { MailService } from '../mail/mail.service';

const messages = {
  BOOKING_CREATED: {
    subject: 'New clinic booking',
    text: 'A new booking was created. Open the admin dashboard to review it.',
  },
  CLOCK_IN_REMINDER: {
    subject: 'Clock-in reminder',
    text: 'Please clock in through the admin dashboard.',
  },
  CLOCK_OUT_REMINDER: {
    subject: 'Clock-out reminder',
    text: 'Please clock out through the admin dashboard.',
  },
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly config: ConfigService,
    private readonly events: EventLogService,
    private readonly mail: MailService,
  ) {}

  async publish(event: keyof typeof messages): Promise<void> {
    const webhook = this.sendWebhook(event);
    const recipient = this.config.get<string>('SMTP_NOTIFICATION_TO');
    if (!recipient) {
      await webhook;
      return;
    }

    const { subject, text } = messages[event];
    // MailService logs delivery errors. Email and dashboard delivery are independent.
    await Promise.all([webhook, this.mail.sendEmail(recipient, subject, text).catch(() => undefined)]);
  }

  private async sendWebhook(event: keyof typeof messages): Promise<void> {
    const secret = this.config.get<string>('NOTIFICATION_WEBHOOK_SECRET');
    if (!secret) return;
    const url = this.config.get('WEBHOOK_URL', 'http://127.0.0.1:3000/api/webhooks/notifications');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + secret },
        body: JSON.stringify({ event }),
        redirect: 'error',
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        this.events.record({ event: 'webhook.delivery_failed', level: 'error', httpStatus: response.status });
        return;
      }
      this.events.record({ event: 'webhook.sent', level: 'info' });
    } catch (error) {
      this.events.record({
        event: 'webhook.delivery_failed',
        level: 'error',
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
      });
    }
  }
}
