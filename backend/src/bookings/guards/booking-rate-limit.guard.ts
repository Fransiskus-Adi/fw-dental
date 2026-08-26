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
  private ipRequests = new Map<string, RateLimitRecord>();
  private phoneRequests = new Map<string, RateLimitRecord>();

  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_REQUESTS = 3;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const now = Date.now();

    // 1. IP Rate Limiting
    const rawIp =
      request.ip ||
      request.headers['x-forwarded-for'] ||
      request.connection?.remoteAddress;

    // Normalize IP
    const ip = typeof rawIp === 'string' ? rawIp.trim() : null;

    if (ip) {
      const ipRecord = this.ipRequests.get(ip) || { timestamps: [] };
      // Filter out timestamps older than WINDOW_MS
      ipRecord.timestamps = ipRecord.timestamps.filter(
        (time) => now - time < this.WINDOW_MS,
      );

      if (ipRecord.timestamps.length >= this.MAX_REQUESTS) {
        throw new HttpException(
          'Too many booking requests from this IP. Please try again in 15 minutes.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      ipRecord.timestamps.push(now);
      this.ipRequests.set(ip, ipRecord);
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
    if (this.ipRequests.size > 500) {
      for (const [key, record] of this.ipRequests.entries()) {
        const activeTimestamps = record.timestamps.filter(
          (time) => now - time < this.WINDOW_MS,
        );
        if (activeTimestamps.length === 0) {
          this.ipRequests.delete(key);
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
