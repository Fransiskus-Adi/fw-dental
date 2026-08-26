import { ExecutionContext, HttpException } from '@nestjs/common';
import { BookingRateLimitGuard } from './booking-rate-limit.guard';

describe('BookingRateLimitGuard', () => {
  let guard: BookingRateLimitGuard;

  beforeEach(() => {
    guard = new BookingRateLimitGuard();
  });

  const createMockContext = (ip: string, phone?: string): ExecutionContext => {
    const req = {
      ip,
      headers: {},
      connection: {},
      body: {
        phone,
      },
    };
    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow initial requests within limit', () => {
    const context = createMockContext('192.168.1.1', '1234567890');
    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should block requests from same IP after limit exceeded', () => {
    const context = createMockContext('192.168.1.2', '1111111111');
    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);

    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(() => guard.canActivate(context)).toThrow(
      'Too many booking requests from this IP.',
    );
  });

  it('should block requests from same phone number after limit exceeded', () => {
    // Submit 3 requests from different IPs but the same phone number
    const context1 = createMockContext('192.168.1.3', '9999999999');
    const context2 = createMockContext('192.168.1.4', '9999999999');
    const context3 = createMockContext('192.168.1.5', '9999999999');
    const context4 = createMockContext('192.168.1.6', '9999999999');

    expect(guard.canActivate(context1)).toBe(true);
    expect(guard.canActivate(context2)).toBe(true);
    expect(guard.canActivate(context3)).toBe(true);

    expect(() => guard.canActivate(context4)).toThrow(HttpException);
    expect(() => guard.canActivate(context4)).toThrow(
      'Too many booking requests for this phone number.',
    );
  });
});
