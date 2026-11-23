import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';

const windowMs = 5 * 60 * 1000;
const capacity = 10_000;

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly attempts = new Map<string, { count: number; expiresAt: number }>();

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const action = context.getHandler().name;
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    const email: unknown = request.body?.email;

    // Keys are inserted in expiration order because the window has a fixed duration.
    const now = Date.now();
    for (const [key, entry] of this.attempts) {
      if (entry.expiresAt > now) break;
      this.attempts.delete(key);
    }
    this.record(`${action}:${ip}`, action === 'login' ? 25 : 12, now, response);
    if (action === 'login' && typeof email === 'string' && email.length <= 255) {
      const identifier = createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
      this.record(`login:${ip}:${identifier}`, 8, now, response);
    }
    this.record('auth', 300, now, response);
    return true;
  }

  private record(key: string, limit: number, now: number, response: Response) {
    const entry = this.attempts.get(key);
    if (entry ? entry.count >= limit : this.attempts.size >= capacity) {
      response.setHeader('Retry-After', Math.ceil(((entry?.expiresAt ?? now + windowMs) - now) / 1000));
      throw new HttpException('Too many attempts. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (entry) entry.count++;
    else this.attempts.set(key, { count: 1, expiresAt: now + windowMs });
  }
}
