import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private webhookUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>(
      'WEBHOOK_URL',
      'http://localhost:3000/api/webhooks/notifications',
    );
  }

  async triggerWebhook(event: string, payload: any): Promise<boolean> {
    try {
      this.logger.log(`Triggering webhook for event: ${event} to URL: ${this.webhookUrl}`);
      
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          payload,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        this.logger.error(
          `Webhook failed with status: ${response.status} ${response.statusText}`,
        );
        return false;
      }

      this.logger.log(`Webhook triggered successfully for event: ${event}`);
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to trigger webhook for event ${event}: ${error.message}`,
      );
      return false;
    }
  }
}
