import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventLogService } from '../logging/event-log.service';

type NotificationEvent = 'BOOKING_CREATED' | 'CLOCK_IN_REMINDER' | 'CLOCK_OUT_REMINDER';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly config: ConfigService,
    private readonly events: EventLogService,
  ) {}

  async triggerWebhook(event: NotificationEvent): Promise<boolean> {
    const secret = this.config.get<string>('NOTIFICATION_WEBHOOK_SECRET');
    if (!secret) return false;
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
        return false;
      }
      this.events.record({ event: 'webhook.sent', level: 'info' });
      return true;
    } catch (error) {
      this.events.record({
        event: 'webhook.delivery_failed',
        level: 'error',
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
      });
      return false;
    }
  }
}
