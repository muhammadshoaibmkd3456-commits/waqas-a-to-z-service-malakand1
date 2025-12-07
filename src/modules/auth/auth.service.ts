import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../database/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { FraudDetectionService, FraudReason } from './services/fraud-detection.service';
import { IpBlockerService } from './services/ip-blocker.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private fraudDetectionService: FraudDetectionService,
    private ipBlockerService: IpBlockerService,
  ) {}

  async register(registerDto: RegisterDto, ipAddress?: string) {
    const { email, password, confirmPassword, firstName, lastName, phone } =
      registerDto;

    // Validate passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // IP Fraud Detection
    if (ipAddress) {
      // Check if IP is blocked
      if (this.ipBlockerService.isIpBlocked(ipAddress)) {
        const blockRecord = this.ipBlockerService.getBlockRecord(ipAddress);
        this.logger.warn(`Registration blocked: IP ${ipAddress} is blocked - ${blockRecord?.reason}`);
        await this.fraudDetectionService.logFraudAttempt(
          ipAddress,
          email,
          phone || '',
          FraudReason.BLACKLISTED_IP,
          { reason: 'IP is blocked' },
        );
        throw new ForbiddenException(
          `Your IP has been temporarily blocked. Please try again later.`,
        );
      }

      // Check IP reputation for fraud
      const ipFraudCheck = await this.fraudDetectionService.checkIpFraud(ipAddress, email);
      if (ipFraudCheck.isFraud) {
        this.logger.warn(
          `Suspicious IP detected during registration: ${ipAddress} - Score: ${ipFraudCheck.fraudScore}`,
        );
        await this.fraudDetectionService.logFraudAttempt(
          ipAddress,
          email,
          phone || '',
          ipFraudCheck.reasons[0] || FraudReason.BLACKLISTED_IP,
          ipFraudCheck.details,
        );

        // Block IP for high-risk detections
        if (
          ipFraudCheck.reasons.includes(FraudReason.TOR_IP) ||
          ipFraudCheck.reasons.includes(FraudReason.BLACKLISTED_IP)
        ) {
          this.ipBlockerService.blockIp(
            ipAddress,
            `High-risk IP: ${ipFraudCheck.reasons.join(', ')}`,
            24,
          );
          throw new ForbiddenException(
            'Registration from your location is not allowed. Please contact support.',
          );
        }

        // For moderate fraud scores, require additional verification
        if (ipFraudCheck.fraudScore >= 50) {
          throw new ForbiddenException(
            'Your registration request could not be processed. Please try again or contact support.',
          );
        }
      }
    }

    // Check if user exists
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Create new user
    const user = this.usersRepository.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      status: UserStatus.PENDING_VERIFICATION,
    });

    await this.usersRepository.save(user);

    this.logger.log(`User registered: ${email} from IP: ${ipAddress}`);

    return {
      id: user.id,
      email: user.email,
      message: 'Registration successful. Please verify your email.',
    };
  }

  async signin(loginDto: LoginDto, ipAddress: string) {
    const { email, password, mfaCode } = loginDto;

    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account status
    if (!user.canAttemptLogin()) {
      throw new UnauthorizedException(
        'Account is locked or inactive. Please contact support.',
      );
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;

      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        user.status = UserStatus.SUSPENDED;
      }

      await this.usersRepository.save(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaCode) {
        throw new BadRequestException('MFA code required');
      }

      const isValidMfa = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaCode,
        window: 2,
      });

      if (!isValidMfa) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    // Reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    user.lastLoginIp = ipAddress;
    user.status = UserStatus.ACTIVE;

    await this.usersRepository.save(user);

    this.logger.log(`User signed in: ${email}`);

    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto, ipAddress: string) {
    // Alias for signin - for backward compatibility
    return this.signin(loginDto, ipAddress);
  }

  async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    user.refreshToken = refreshToken;
    await this.usersRepository.save(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async setupMfa(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const secret = speakeasy.generateSecret({
      name: `A to Z Services (${user.email})`,
      issuer: 'A to Z Services',
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  async confirmMfa(userId: string, mfaCode: string, secret: string) {
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: mfaCode,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid MFA code');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    user.mfaSecret = secret;
    user.mfaEnabled = true;

    await this.usersRepository.save(user);

    this.logger.log(`MFA enabled for user: ${user.email}`);

    return { message: 'MFA enabled successfully' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    user.refreshToken = null;
    await this.usersRepository.save(user);

    this.logger.log(`User logged out: ${user.email}`);

    return { message: 'Logged out successfully' };
  }
}
