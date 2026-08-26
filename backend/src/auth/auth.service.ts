import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RolesService } from '../roles/roles.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

interface OtpData {
  otp: string;
  expiresAt: number;
  verified?: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // In-memory store for OTPs: email -> { otp, expiresAt }
  private otpStore = new Map<string, OtpData>();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly rolesService: RolesService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (user && user.password) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Default mock behavior if no password is provided (since frontend has password="password")
    const validatedUser = await this.validateUser(email, password || '');
    if (!validatedUser) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const roleCode = validatedUser.roleCode;
    const role = roleCode ? await this.rolesService.findByCode(roleCode) : null;
    const permissions = role?.permissions || {};

    const payload = { 
      email: validatedUser.email, 
      sub: validatedUser.id,
      role: roleCode,
      permissions,
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: validatedUser.id,
        name: validatedUser.name,
        email: validatedUser.email,
        role: roleCode,
        permissions,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email: emailOrPhone } = forgotPasswordDto;
    const user = await this.usersService.findByEmailOrPhone(emailOrPhone);
    if (!user) {
      throw new NotFoundException('User with this email or phone number does not exist');
    }

    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Cache it for 5 minutes (keyed by the input identifier)
    const expiresAt = Date.now() + 5 * 60 * 1000;
    this.otpStore.set(emailOrPhone, { otp, expiresAt });

    // Send OTP depending on whether it matches phone or email
    if (user.phone === emailOrPhone) {
      // For phone number: currently simulate sending it by printing to console logs
      this.logger.log(
        `Generated OTP for phone number ${emailOrPhone}: [ ${otp} ] (Expires in 5 minutes)`,
      );
    } else {
      // For email address: send real email using MailService
      await this.mailService.sendOtpEmail(user.email, otp);
    }

    return {
      message: 'OTP has been generated and sent successfully',
      email: emailOrPhone,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email: emailOrPhone, otp } = verifyOtpDto;

    const cachedData = this.otpStore.get(emailOrPhone);
    if (!cachedData) {
      throw new BadRequestException('No active OTP found for this email or phone number');
    }

    if (Date.now() > cachedData.expiresAt) {
      this.otpStore.delete(emailOrPhone);
      throw new BadRequestException('OTP has expired');
    }

    if (cachedData.otp !== otp) {
      throw new BadRequestException('Invalid OTP code');
    }

    // OTP verified successfully, mark as verified and extend expiry for 5 minutes to allow password reset
    cachedData.verified = true;
    cachedData.expiresAt = Date.now() + 5 * 60 * 1000;
    this.otpStore.set(emailOrPhone, cachedData);

    return {
      message: 'OTP verified successfully',
      status: 'verified',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email: emailOrPhone, password } = resetPasswordDto;

    const cachedData = this.otpStore.get(emailOrPhone);
    if (!cachedData || !cachedData.verified) {
      throw new BadRequestException(
        'OTP verification is required before resetting password',
      );
    }

    if (Date.now() > cachedData.expiresAt) {
      this.otpStore.delete(emailOrPhone);
      throw new BadRequestException(
        'Password reset session has expired. Please request a new OTP.',
      );
    }

    const user = await this.usersService.findByEmailOrPhone(emailOrPhone);
    if (!user) {
      throw new NotFoundException('User with this email or phone number does not exist');
    }

    if (!password) {
      throw new BadRequestException('New password is required');
    }

    await this.usersService.updatePassword(user.email, password);

    // Clean up OTP store after successful password reset
    this.otpStore.delete(emailOrPhone);

    return {
      message: 'Password reset successfully',
    };
  }
}
