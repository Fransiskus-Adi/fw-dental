import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
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
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET').trim(),
        signOptions: { expiresIn: '1d' },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  providers: [AuthService, AuthRateLimitGuard, { provide: APP_GUARD, useClass: StaffAccessGuard }],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
