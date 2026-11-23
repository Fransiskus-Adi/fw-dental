import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { randomBytes } from 'node:crypto';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { RolesModule } from '../roles/roles.module';
import { StaffAccessGuard } from './staff-access.guard';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    ConfigModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const configuredSecret = configService
          .get<string>('JWT_SECRET')
          ?.trim();
        const secret =
          configuredSecret === 'super-secret-key-12345'
            ? undefined
            : configuredSecret;
        if (configService.get('NODE_ENV') === 'production' && (!secret || secret.length < 32)) {
          throw new Error(
            'Set a private JWT_SECRET of at least 32 characters before starting in production.',
          );
        }
        return {
          secret: secret || randomBytes(32).toString('hex'),
          signOptions: { expiresIn: '1d' },
          verifyOptions: { algorithms: ['HS256'] },
        };
      },
    }),
  ],
  providers: [AuthService, AuthRateLimitGuard, { provide: APP_GUARD, useClass: StaffAccessGuard }],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
