import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Version,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FraudDetectionService } from '../services/fraud-detection.service';
import { OtpService } from '../services/otp.service';
import { IpBlockerService } from '../services/ip-blocker.service';
import { JwtAuthGuard } from '../../../common/guards/jwt.guard';
import { OtpPurpose } from '../../../database/entities/otp.entity';

@ApiTags('security')
@Controller('security')
export class SecurityController {
  constructor(
    private fraudDetectionService: FraudDetectionService,
    private otpService: OtpService,
    private ipBlockerService: IpBlockerService,
  ) {}

  /**
   * Check email for fraud
   */
  @Post('check-email')
  @Version('1')
  async checkEmail(@Body() { email }: { email: string }) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const result = await this.fraudDetectionService.checkEmailFraud(email);

    return {
      email,
      isFraud: result.isFraud,
      fraudScore: result.fraudScore,
      reasons: result.reasons,
      details: result.details,
    };
  }

  /**
   * Check phone for fraud
   */
  @Post('check-phone')
  @Version('1')
  async checkPhone(
    @Body() { phone, countryCode }: { phone: string; countryCode?: string },
  ) {
    if (!phone) {
      throw new BadRequestException('Phone is required');
    }

    const result = await this.fraudDetectionService.checkPhoneFraud(
      phone,
      countryCode,
    );

    return {
      phone,
      isFraud: result.isFraud,
      fraudScore: result.fraudScore,
      reasons: result.reasons,
      details: result.details,
    };
  }

  /**
   * Check IP for fraud
   */
  @Post('check-ip')
  @Version('1')
  async checkIp(@Body() { ipAddress }: { ipAddress: string }) {
    if (!ipAddress) {
      throw new BadRequestException('IP address is required');
    }

    const result = await this.fraudDetectionService.checkIpFraud(ipAddress);
    const isBlocked = await this.ipBlockerService.isIpBlocked(ipAddress);

    return {
      ipAddress,
      isFraud: result.isFraud,
      isBlocked,
      fraudScore: result.fraudScore,
      reasons: result.reasons,
      details: result.details,
    };
  }

  /**
   * Generate OTP for email verification
   */
  @Post('otp/email')
  @Version('1')
  async generateEmailOtp(@Body() { email }: { email: string }) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    // Check if email is fraudulent
    const emailFraud = await this.fraudDetectionService.checkEmailFraud(email);
    if (emailFraud.isFraud) {
      throw new BadRequestException(
        'Email validation failed. Please use a different email.',
      );
    }

    const result = await this.otpService.generateOtp(
      OtpPurpose.EMAIL_VERIFICATION,
      email,
    );

    return {
      message: 'OTP sent to email',
      otpId: result.id,
      expiresIn: result.expiresIn,
    };
  }

  /**
   * Generate OTP for phone verification
   */
  @Post('otp/phone')
  @Version('1')
  async generatePhoneOtp(
    @Body() { phone, countryCode }: { phone: string; countryCode?: string },
    @Request() req,
  ) {
    if (!phone) {
      throw new BadRequestException('Phone is required');
    }

    // Check if IP is blocked
    const ipAddress = req.ip || req.connection.remoteAddress;
    const isBlocked = await this.ipBlockerService.isIpBlocked(ipAddress);
    if (isBlocked) {
      throw new BadRequestException(
        'Your IP has been temporarily blocked due to suspicious activity',
      );
    }

    // Check if phone is fraudulent
    const phoneFraud = await this.fraudDetectionService.checkPhoneFraud(
      phone,
      countryCode,
    );
    if (phoneFraud.isFraud) {
      // Log fraud attempt
      await this.fraudDetectionService.logFraudAttempt(
        ipAddress,
        '',
        phone,
        phoneFraud.reasons[0],
        phoneFraud.details,
      );

      // Block IP
      await this.ipBlockerService.blockIp(
        ipAddress,
        `Fake phone number attempt: ${phone}`,
        24,
      );

      throw new BadRequestException(
        'Phone validation failed. Please use a valid phone number.',
      );
    }

    const result = await this.otpService.generateOtp(
      OtpPurpose.PHONE_VERIFICATION,
      undefined,
      phone,
      undefined,
      ipAddress,
    );

    return {
      message: 'OTP sent to phone',
      otpId: result.id,
      expiresIn: result.expiresIn,
    };
  }

  /**
   * Verify OTP
   */
  @Post('otp/verify')
  @Version('1')
  async verifyOtp(
    @Body() { otpId, code, purpose }: { otpId: string; code: string; purpose: OtpPurpose },
  ) {
    if (!otpId || !code || !purpose) {
      throw new BadRequestException('OTP ID, code, and purpose are required');
    }

    const result = await this.otpService.verifyOtp(otpId, code, purpose);

    return {
      verified: result.verified,
      userId: result.userId,
      email: result.email,
      phone: result.phone,
    };
  }

  /**
   * Get IP block status
   */
  @Get('ip-status/:ipAddress')
  @Version('1')
  async getIpStatus(@Param('ipAddress') ipAddress: string) {
    const isBlocked = await this.ipBlockerService.isIpBlocked(ipAddress);
    const blockRecord = await this.ipBlockerService.getBlockRecord(ipAddress);

    return {
      ipAddress,
      isBlocked,
      blockRecord: blockRecord || null,
    };
  }

  /**
   * Get all blocked IPs (admin only)
   */
  @Get('blocked-ips')
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getBlockedIps(@Request() req) {
    // In production, check if user is admin
    const blockedIps = await this.ipBlockerService.getAllBlockedIps();

    return {
      count: blockedIps.length,
      blockedIps,
    };
  }

  /**
   * Unblock IP (admin only)
   */
  @Post('unblock-ip')
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async unblockIp(
    @Body() { ipAddress }: { ipAddress: string },
    @Request() req,
  ) {
    if (!ipAddress) {
      throw new BadRequestException('IP address is required');
    }

    // In production, check if user is admin
    const success = await this.ipBlockerService.unblockIp(ipAddress);

    return {
      success,
      message: success ? 'IP unblocked successfully' : 'IP not found in blocklist',
    };
  }
}
