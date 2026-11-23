import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

interface RateLimitRecord {
  timestamps: number[];
}

@Injectable()
export class BookingRateLimitGuard implements CanActivate {
  private callerRequests = new Map<string, RateLimitRecord>();
  private phoneRequests = new Map<string, RateLimitRecord>();

  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_REQUESTS = 3;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const now = Date.now();

    // Staff calls share the application server's IP, so rate-limit by staff ID.
    const rawIp =
      request.ip ||
      request.connection?.remoteAddress;

    const caller = request.staff?.id
      ? `staff:${request.staff.id}`
      : typeof rawIp === 'string' && rawIp.trim();
    if (caller) {
      const record = this.callerRequests.get(caller) || { timestamps: [] };
      // Filter out timestamps older than WINDOW_MS
      record.timestamps = record.timestamps.filter(
        (time) => now - time < this.WINDOW_MS,
      );

      if (record.timestamps.length >= this.MAX_REQUESTS) {
        throw new HttpException(
          request.staff?.id
            ? 'Too many booking requests from this staff account. Please try again in 15 minutes.'
            : 'Too many booking requests from this IP. Please try again in 15 minutes.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      record.timestamps.push(now);
      this.callerRequests.set(caller, record);
    }

    // 2. Phone Number Rate Limiting
    const phone = request.body?.phone;
    if (typeof phone === 'string' && phone.trim().length > 0) {
      const normalizedPhone = phone.trim().replace(/[^0-9]/g, ''); // Keep digits only for matching
      if (normalizedPhone.length > 0) {
        const phoneRecord = this.phoneRequests.get(normalizedPhone) || {
          timestamps: [],
        };
        phoneRecord.timestamps = phoneRecord.timestamps.filter(
          (time) => now - time < this.WINDOW_MS,
        );

        if (phoneRecord.timestamps.length >= this.MAX_REQUESTS) {
          throw new HttpException(
            'Too many booking requests for this phone number. Please try again in 15 minutes.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        phoneRecord.timestamps.push(now);
        this.phoneRequests.set(normalizedPhone, phoneRecord);
      }
    }

    // 3. Periodic cache cleanup to avoid memory leak
    this.cleanExpiredRecords(now);

    return true;
  }

  private cleanExpiredRecords(now: number) {
    // Only cleanup occasionally if the cache grows large
    if (this.callerRequests.size > 500) {
      for (const [key, record] of this.callerRequests.entries()) {
        const activeTimestamps = record.timestamps.filter(
          (time) => now - time < this.WINDOW_MS,
        );
        if (activeTimestamps.length === 0) {
          this.callerRequests.delete(key);
        } else {
          record.timestamps = activeTimestamps;
        }
      }
    }

    if (this.phoneRequests.size > 500) {
      for (const [key, record] of this.phoneRequests.entries()) {
        const activeTimestamps = record.timestamps.filter(
          (time) => now - time < this.WINDOW_MS,
        );
        if (activeTimestamps.length === 0) {
          this.phoneRequests.delete(key);
        } else {
          record.timestamps = activeTimestamps;
        }
      }
    }
  }
}
