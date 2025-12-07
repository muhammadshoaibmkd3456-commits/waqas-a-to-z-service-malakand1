import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../../database/entities/user.entity';
import { OtpService } from './otp.service';
import { FraudDetectionService, FraudReason } from './fraud-detection.service';
import { IpBlockerService } from './ip-blocker.service';

export interface VerificationStatus {
  emailVerified: boolean;
  phoneVerified: boolean;
  fraudCheckPassed: boolean;
  ipClean: boolean;
  sessionValid: boolean;
  canLogin: boolean;
  failureReasons: string[];
}

export interface LoginAttemptRecord {
  ipAddress: string;
  email: string;
  timestamp: Date;
  success: boolean;
  reason?: string;
}

@Injectable()
export class DualVerificationService {
  private readonly logger = new Logger(DualVerificationService.name);

  // In-memory store for login attempts (use Redis in production)
  private loginAttempts = new Map<string, LoginAttemptRecord[]>();
  
  // In-memory store for device tracking
  private deviceFingerprints = new Map<string, { lastSeen: Date; attempts: number }>();

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private otpService: OtpService,
    private fraudDetectionService: FraudDetectionService,
    private ipBlockerService: IpBlockerService,
  ) {}

  /**
   * Check if user can login (comprehensive verification)
   */
  async checkLoginEligibility(
    email: string,
    ipAddress: string,
    deviceFingerprint?: string,
  ): Promise<VerificationStatus> {
    const failureReasons: string[] = [];
    let emailVerified = false;
    let phoneVerified = false;
    let fraudCheckPassed = true;
    let ipClean = true;
    let sessionValid = true;

    try {
      // 1. Check if user exists
      const user = await this.usersRepository.findOne({ where: { email } });
      if (!user) {
        failureReasons.push('User not found');
        return {
          emailVerified: false,
          phoneVerified: false,
          fraudCheckPassed: false,
          ipClean: false,
          sessionValid: false,
          canLogin: false,
          failureReasons,
        };
      }

      // 2. Check if IP is blocked
      if (this.ipBlockerService.isIpBlocked(ipAddress)) {
        ipClean = false;
        failureReasons.push('IP address is blocked due to suspicious activity');
        this.logger.warn(`Login attempt from blocked IP: ${ipAddress} for user: ${email}`);
      }

      // 3. Check email verification
      emailVerified = await this.otpService.isEmailVerified(email);
      if (!emailVerified) {
        failureReasons.push('Email not verified');
      }

      // 4. Check phone verification
      if (user.phone) {
        phoneVerified = await this.otpService.isPhoneVerified(user.phone);
        if (!phoneVerified) {
          failureReasons.push('Mobile number not verified');
        }
      }

      // 5. Check IP fraud
      const ipFraudCheck = await this.fraudDetectionService.checkIpFraud(ipAddress, email);
      if (ipFraudCheck.isFraud) {
        ipClean = false;
        fraudCheckPassed = false;
        failureReasons.push(`IP fraud detected: ${ipFraudCheck.reasons.join(', ')}`);
        
        // Log fraud attempt
        await this.fraudDetectionService.logFraudAttempt(
          ipAddress,
          email,
          user.phone || '',
          ipFraudCheck.reasons[0] || FraudReason.BLACKLISTED_IP,
          ipFraudCheck.details,
        );
      }

      // 6. Check for bruteforce attempts
      const bruteforceDetected = await this.checkBruteforceAttempt(email, ipAddress);
      if (bruteforceDetected) {
        fraudCheckPassed = false;
        failureReasons.push('Too many login attempts. Please try again later.');
        
        // Block IP
        this.ipBlockerService.blockIp(ipAddress, 'Bruteforce attack detected', 24);
        ipClean = false;
      }

      // 7. Check device fingerprint (if provided)
      if (deviceFingerprint) {
        const deviceTrusted = await this.isDeviceTrusted(deviceFingerprint, email);
        if (!deviceTrusted) {
          failureReasons.push('Unrecognized device. Additional verification required.');
          sessionValid = false;
        }
      }

      // 8. Check account status
      if (user.status === UserStatus.SUSPENDED) {
        failureReasons.push('Account is temporarily locked. Please contact support.');
        sessionValid = false;
      }

      // 9. Check if user is frozen due to fraud
      if (user.lockedUntil && new Date() < user.lockedUntil) {
        failureReasons.push('Account is temporarily frozen due to security concerns.');
        sessionValid = false;
      }

      const canLogin = emailVerified && phoneVerified && fraudCheckPassed && ipClean && sessionValid;

      return {
        emailVerified,
        phoneVerified,
        fraudCheckPassed,
        ipClean,
        sessionValid,
        canLogin,
        failureReasons,
      };
    } catch (error) {
      this.logger.error(`Error checking login eligibility: ${error.message}`);
      failureReasons.push('Security check failed. Please try again.');
      return {
        emailVerified: false,
        phoneVerified: false,
        fraudCheckPassed: false,
        ipClean: false,
        sessionValid: false,
        canLogin: false,
        failureReasons,
      };
    }
  }

  /**
   * Record login attempt
   */
  async recordLoginAttempt(
    email: string,
    ipAddress: string,
    success: boolean,
    reason?: string,
  ): Promise<void> {
    try {
      const key = `${email}:${ipAddress}`;
      const attempts = this.loginAttempts.get(key) || [];

      attempts.push({
        ipAddress,
        email,
        timestamp: new Date(),
        success,
        reason,
      });

      // Keep only last 24 hours of attempts
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentAttempts = attempts.filter((a) => a.timestamp > oneDayAgo);

      this.loginAttempts.set(key, recentAttempts);

      if (!success) {
        this.logger.warn(`Failed login attempt: ${email} from IP: ${ipAddress} - Reason: ${reason}`);
      }
    } catch (error) {
      this.logger.error(`Error recording login attempt: ${error.message}`);
    }
  }

  /**
   * Check for bruteforce attempts
   */
  async checkBruteforceAttempt(email: string, ipAddress: string): Promise<boolean> {
    try {
      const key = `${email}:${ipAddress}`;
      const attempts = this.loginAttempts.get(key) || [];

      // Count failed attempts in last 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const recentFailedAttempts = attempts.filter(
        (a) => !a.success && a.timestamp > fifteenMinutesAgo,
      );

      // Also check for fast repeated attempts (bot-like behavior)
      if (attempts.length >= 5) {
        const lastFiveAttempts = attempts.slice(-5);
        const timeDiff = lastFiveAttempts[4].timestamp.getTime() - lastFiveAttempts[0].timestamp.getTime();
        
        // If 5 attempts in less than 30 seconds = bot-like
        if (timeDiff < 30 * 1000) {
          this.logger.warn(`Bot-like behavior detected: ${email} from IP: ${ipAddress}`);
          return true;
        }
      }

      return recentFailedAttempts.length >= 5;
    } catch (error) {
      this.logger.error(`Error checking bruteforce attempt: ${error.message}`);
      return false;
    }
  }

  /**
   * Check for wrong email patterns
   */
  async checkWrongEmailPattern(email: string): Promise<boolean> {
    try {
      const patterns = [
        /^[0-9]+@/,
        /test/i,
        /fake/i,
        /spam/i,
        /noreply/i,
        /admin@admin/i,
        /[0-9]{10,}@/,
      ];

      return patterns.some((pattern) => pattern.test(email));
    } catch (error) {
      this.logger.error(`Error checking email pattern: ${error.message}`);
      return false;
    }
  }

  /**
   * Check for wrong OTP patterns
   */
  async checkWrongOtpPattern(otp: string): Promise<boolean> {
    try {
      // Check for sequential patterns (000000, 111111, 123456, etc.)
      const sequentialPatterns = [
        /^0+$/,
        /^1+$/,
        /^2+$/,
        /^3+$/,
        /^4+$/,
        /^5+$/,
        /^6+$/,
        /^7+$/,
        /^8+$/,
        /^9+$/,
        /^0123456789/,
        /^123456/,
        /^654321/,
      ];

      return sequentialPatterns.some((pattern) => pattern.test(otp));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking OTP pattern: ${message}`);
      return false;
    }
  }

  /**
   * Check for multiple OTP requests
   */
  async checkMultipleOtpRequests(email: string, ipAddress: string): Promise<number> {
    try {
      const key = `otp:${email}:${ipAddress}`;
      const attempts = this.loginAttempts.get(key) || [];

      // Count OTP requests in last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentOtpRequests = attempts.filter((a) => a.timestamp > fiveMinutesAgo);

      return recentOtpRequests.length;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking multiple OTP requests: ${message}`);
      return 0;
    }
  }

  /**
   * Block user temporarily due to fraud
   */
  async freezeUserAccount(email: string, durationMinutes: number = 30): Promise<void> {
    try {
      const user = await this.usersRepository.findOne({ where: { email } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
      user.lockedUntil = lockedUntil;
      user.status = UserStatus.SUSPENDED;

      await this.usersRepository.save(user);

      this.logger.warn(`User account locked: ${email} until ${lockedUntil}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error freezing user account: ${message}`);
    }
  }

  /**
   * Unfreeze user account
   */
  async unfreezeUserAccount(email: string): Promise<void> {
    try {
      const user = await this.usersRepository.findOne({ where: { email } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      user.lockedUntil = null;
      user.status = UserStatus.ACTIVE;

      await this.usersRepository.save(user);

      this.logger.log(`User account unfrozen: ${email}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error unfreezing user account: ${message}`);
    }
  }

  /**
   * Check if device is trusted
   */
  private async isDeviceTrusted(deviceFingerprint: string, email: string): Promise<boolean> {
    try {
      const deviceInfo = this.deviceFingerprints.get(deviceFingerprint);

      if (!deviceInfo) {
        // New device - not trusted
        this.deviceFingerprints.set(deviceFingerprint, {
          lastSeen: new Date(),
          attempts: 1,
        });
        return false;
      }

      // Update last seen
      deviceInfo.lastSeen = new Date();
      deviceInfo.attempts += 1;

      // Device is trusted if seen before
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking device trust: ${message}`);
      return false;
    }
  }

  /**
   * Get verification status summary
   */
  async getVerificationSummary(email: string): Promise<{
    emailVerified: boolean;
    phoneVerified: boolean;
    accountStatus: string;
    lastLoginAt: Date | null;
    lastLoginIp: string | null;
  }> {
    try {
      const user = await this.usersRepository.findOne({ where: { email } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const emailVerified = await this.otpService.isEmailVerified(email);
      const phoneVerified = user.phone ? await this.otpService.isPhoneVerified(user.phone) : false;

      return {
        emailVerified,
        phoneVerified,
        accountStatus: user.status,
        lastLoginAt: user.lastLoginAt || null,
        lastLoginIp: user.lastLoginIp || null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting verification summary: ${message}`);
      throw error;
    }
  }

  /**
   * Clear login attempts for user
   */
  async clearLoginAttempts(email: string, ipAddress?: string): Promise<void> {
    try {
      if (ipAddress) {
        const key = `${email}:${ipAddress}`;
        this.loginAttempts.delete(key);
      } else {
        // Clear all attempts for user
        for (const key of this.loginAttempts.keys()) {
          if (key.startsWith(`${email}:`)) {
            this.loginAttempts.delete(key);
          }
        }
      }

      this.logger.log(`Cleared login attempts for: ${email}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error clearing login attempts: ${message}`);
    }
  }
}
