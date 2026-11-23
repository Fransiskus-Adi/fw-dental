import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../mail/mail.service';
import { RolesService } from '../roles/roles.service';
import { UsersService } from '../users/users.service';

// Compare missing accounts as well, using the same work factor as new passwords.
const fallbackHash = bcrypt.hash(randomBytes(32).toString('hex'), 12);

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private pendingResetEmails = 0;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly roles: RolesService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findByEmailWithPassword(email);
    const isMatch = await bcrypt.compare(password, user?.password ?? await fallbackHash);
    if (!user?.password || !isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const role = user.roleCode ? await this.roles.findByCode(user.roleCode) : null;
    if (role?.enabled !== 1 || role.deleted !== 0) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      access_token: this.jwt.sign({ sub: user.id, sv: user.sessionVersion }),
    };
  }

  forgotPassword(email: string) {
    if (this.pendingResetEmails < 8) {
      this.pendingResetEmails++;
      void this.sendResetEmail(email)
        .catch(() => this.logger.warn('A password reset could not be delivered.'))
        .finally(() => this.pendingResetEmails--);
    }
    return { message: 'If the email belongs to an eligible account, you will receive a reset link.' };
  }

  private async sendResetEmail(email: string) {
    const token = randomBytes(32).toString('base64url');
    const recipient = await this.users.issuePasswordReset(email, tokenHash(token));
    if (!recipient) return;

    const link = new URL('/admin/login', this.config.get('PUBLIC_APP_URL', 'http://localhost:3000'));
    // A fragment stays in the browser and out of HTTP access logs and referrers.
    link.hash = new URLSearchParams({ reset: token }).toString();
    await this.mail.sendPasswordResetEmail(recipient, link.toString());
  }

  async resetPassword(token: string, password: string) {
    if (!await this.users.resetPassword(tokenHash(token), password)) {
      throw new BadRequestException('Reset link is invalid or has expired. Request a new link.');
    }
    return { message: 'Password reset successfully' };
  }
}
