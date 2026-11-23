import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

type HttpEvent = {
  event: 'http.request' | 'http.aborted';
  level: 'info' | 'warn' | 'error';
  requestId: string;
  method: string;
  route?: string;
  httpStatus?: number;
  durationMs: number;
  errorType?: string;
};

type ApplicationEvent =
  | { event: 'app.started' | 'mail.sent' | 'webhook.sent'; level: 'info' }
  | { event: 'mail.unconfigured'; level: 'warn' }
  | {
      event:
        | 'mail.initialization_failed'
        | 'mail.delivery_failed'
        | 'webhook.delivery_failed';
      level: 'error';
      httpStatus?: number;
      errorType?: string;
    };

@Injectable()
export class EventLogService {
  private readonly logger = new Logger(EventLogService.name);
  private pending = 0;
  private nextWarningAt = 0;

  constructor(private readonly dataSource: DataSource) {}

  record(entry: HttpEvent | ApplicationEvent): void {
    if (this.pending >= 32) {
      this.warnUnavailable();
      return;
    }

    this.pending++;
    void this.write(entry);
  }

  private async write(entry: HttpEvent | ApplicationEvent): Promise<void> {
    try {
      await this.dataSource.query(
        `INSERT INTO logging.events
          (level, event, request_id, method, route, http_status, duration_ms, error_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          entry.level,
          entry.event,
          'requestId' in entry ? entry.requestId : null,
          'method' in entry ? entry.method : null,
          'route' in entry ? entry.route : null,
          'httpStatus' in entry ? entry.httpStatus : null,
          'durationMs' in entry ? entry.durationMs : null,
          'errorType' in entry ? entry.errorType : null,
        ],
      );
    } catch {
      this.warnUnavailable();
    } finally {
      this.pending--;
    }
  }

  private warnUnavailable(): void {
    const now = Date.now();
    if (now >= this.nextWarningAt) {
      this.nextWarningAt = now + 60_000;
      this.logger.warn('Some events could not be written to PostgreSQL.');
    }
  }
}
