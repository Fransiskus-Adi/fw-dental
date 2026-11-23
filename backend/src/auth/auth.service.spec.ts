import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import type { MailService } from '../mail/mail.service';
import type { RolesService } from '../roles/roles.service';
import type { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('Password recovery', () => {
  const email = 'staff@example.test';
  const password = 'a new long password';
  const users = { issuePasswordReset: jest.fn(), resetPassword: jest.fn() };
  const mail = { sendPasswordResetEmail: jest.fn() };
  const auth = new AuthService(
    users as unknown as UsersService,
    {} as JwtService,
    mail as unknown as MailService,
    {} as RolesService,
    { get: () => 'https://clinic.example.test' } as unknown as ConfigService,
  );

  beforeEach(() => jest.resetAllMocks());

  it('sends a high-entropy link and stores its digest', async () => {
    users.issuePasswordReset.mockResolvedValue(email);
    const response = auth.forgotPassword(email);
    await new Promise(setImmediate);
    expect(mail.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    const [recipient, link] = mail.sendPasswordResetEmail.mock.calls[0] as [string, string];
    const url = new URL(link);
    const token = new URLSearchParams(url.hash.slice(1)).get('reset')!;
    expect(recipient).toBe(email);
    expect(url.origin + url.pathname).toBe('https://clinic.example.test/admin/login');
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const digest = createHash('sha256').update(token).digest('hex');
    expect(users.issuePasswordReset).toHaveBeenCalledWith(email, digest);
    expect(JSON.stringify(response)).not.toContain(token);
    users.resetPassword.mockResolvedValue(true);
    await auth.resetPassword(token, password);
    expect(users.resetPassword).toHaveBeenCalledWith(digest, password);
  });

  it('returns the same response for an ineligible address', async () => {
    users.issuePasswordReset.mockResolvedValue(undefined);
    const response = auth.forgotPassword(email);
    await new Promise(setImmediate);
    expect(response.message).toContain('If the email belongs');
    expect(mail.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('rejects expired or consumed links', async () => {
    users.resetPassword.mockResolvedValue(false);
    await expect(auth.resetPassword('invalid', password)).rejects.toThrow(BadRequestException);
  });
});
