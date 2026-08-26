import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { User } from '../users/user.entity';

describe('AuthService (Forgot Password & OTP)', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let mailService: jest.Mocked<Partial<MailService>>;

  const mockEmailUser: Partial<User> = {
    id: 'user-id-1',
    name: 'Test Email User',
    email: 'test@example.com',
    phone: '0812345678',
  };

  const mockPhoneUser: Partial<User> = {
    id: 'user-id-2',
    name: 'Test Phone User',
    email: 'phone@example.com',
    phone: '0899999999',
  };

  beforeEach(async () => {
    usersService = {
      findByEmailOrPhone: jest.fn().mockImplementation(async (identifier: string) => {
        if (identifier === 'test@example.com') {
          return mockEmailUser as User;
        }
        if (identifier === '0899999999') {
          return mockPhoneUser as User;
        }
        return null;
      }),
    };
    mailService = {
      sendOtpEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: MailService, useValue: mailService },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('forgotPassword', () => {
    it('should generate OTP and return message for registered email address', async () => {
      const result = await authService.forgotPassword({ email: 'test@example.com' });
      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result.message).toContain('OTP has been generated and sent');
      expect(usersService.findByEmailOrPhone).toHaveBeenCalledWith('test@example.com');
      expect(mailService.sendOtpEmail).toHaveBeenCalledWith('test@example.com', expect.any(String));
    });

    it('should generate OTP and return message for registered phone number', async () => {
      const result = await authService.forgotPassword({ email: '0899999999' });
      expect(result).toBeDefined();
      expect(result.email).toBe('0899999999');
      expect(result.message).toContain('OTP has been generated and sent');
      expect(usersService.findByEmailOrPhone).toHaveBeenCalledWith('0899999999');
      expect(mailService.sendOtpEmail).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user is not found by email or phone', async () => {
      await expect(
        authService.forgotPassword({ email: 'nonexistent@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP successfully with valid code', async () => {
      // First generate OTP
      await authService.forgotPassword({ email: 'test@example.com' });
      
      // Get the code from private otpStore using reflections or internal check
      const otpStore = (authService as any).otpStore;
      const cached = otpStore.get('test@example.com');
      expect(cached).toBeDefined();

      const result = await authService.verifyOtp({
        email: 'test@example.com',
        otp: cached.otp,
      });

      expect(result).toEqual({
        message: 'OTP verified successfully',
        status: 'verified',
      });
    });

    it('should throw BadRequestException for invalid OTP code', async () => {
      await authService.forgotPassword({ email: 'test@example.com' });

      await expect(
        authService.verifyOtp({
          email: 'test@example.com',
          otp: '9999', // Incorrect OTP
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no OTP is stored/cached for the identifier', async () => {
      await expect(
        authService.verifyOtp({
          email: 'test@example.com',
          otp: '1234',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
