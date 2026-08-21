import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

interface OtpData {
  otp: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // In-memory store for OTPs: email -> { otp, expiresAt }
  private otpStore = new Map<string, OtpData>();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

    const payload = { email: validatedUser.email, sub: validatedUser.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: validatedUser.id,
        name: validatedUser.name,
        email: validatedUser.email,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Cache it for 5 minutes
    const expiresAt = Date.now() + 5 * 60 * 1000;
    this.otpStore.set(email, { otp, expiresAt });

    // Print to logs so developers can see/retrieve it
    this.logger.log(
      `Generated OTP for ${email}: [ ${otp} ] (Expires in 5 minutes)`,
    );

    return {
      message:
        'OTP has been generated and sent (please check backend console logs)',
      email,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    const cachedData = this.otpStore.get(email);
    if (!cachedData) {
      throw new BadRequestException('No active OTP found for this email');
    }

    if (Date.now() > cachedData.expiresAt) {
      this.otpStore.delete(email);
      throw new BadRequestException('OTP has expired');
    }

    if (cachedData.otp !== otp) {
      throw new BadRequestException('Invalid OTP code');
    }

    // OTP verified successfully, clean it up
    this.otpStore.delete(email);

    return {
      message: 'OTP verified successfully',
      status: 'verified',
    };
  }
}
