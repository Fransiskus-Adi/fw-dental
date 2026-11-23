import {
  BadRequestException, Body, Controller, Get, Header, HttpCode, HttpStatus,
  Post, Req, UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { PublicRoute, RequireStaff, type StaffRequest } from './staff-access.guard';
import { emailField, parseInput } from '../input';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('session')
  @RequireStaff([])
  session(@Req() request: StaffRequest) {
    return request.staff;
  }

  @Get('notification-access')
  @RequireStaff(['feat_notifications_view'])
  notificationAccess() {
    return { allowed: true };
  }

  @Post('login')
  @PublicRoute()
  @UseGuards(AuthRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  login(@Body('email') email: unknown, @Body('password') password: unknown) {
    if (typeof password !== 'string' || !password || password.length > 1024) {
      throw new BadRequestException('Enter your password.');
    }
    return this.authService.login(parseInput(emailField, email), password);
  }

  @Post('forgot-password')
  @PublicRoute()
  @UseGuards(AuthRateLimitGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @Header('Cache-Control', 'no-store')
  forgotPassword(@Body('email') email: unknown) {
    return this.authService.forgotPassword(parseInput(emailField, email));
  }

  @Post('reset-password')
  @PublicRoute()
  @UseGuards(AuthRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  resetPassword(@Body('token') token: unknown, @Body('password') password: unknown) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token) ||
        typeof password !== 'string' || password.length > 72) {
      throw new BadRequestException('Invalid reset request.');
    }
    return this.authService.resetPassword(token, password);
  }
}
