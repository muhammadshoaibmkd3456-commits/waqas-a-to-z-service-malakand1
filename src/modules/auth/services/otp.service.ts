import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Otp, OtpPurpose, OtpStatus } from '../../../database/entities/otp.entity';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
  ) {}

  /**
   * Generate and send OTP
   */
  async generateOtp(
    purpose: OtpPurpose,
    email?: string,
    phone?: string,
    userId?: string,
    ipAddress?: string,
  ): Promise<{ id: string; expiresIn: number }> {
    try {
      // Invalidate previous OTPs for this purpose
      await this.invalidatePreviousOtps(purpose, email, phone, userId);

      // Generate 6-digit OTP
      const code = this.generateRandomCode();

      // Set expiration to 60 seconds
      const expiresAt = new Date(Date.now() + 60 * 1000);

      const otp = this.otpRepository.create({
        code,
        purpose,
        email,
        phone,
        userId,
        ipAddress,
        expiresAt,
        status: OtpStatus.PENDING,
        attempts: 0,
        maxAttempts: 3,
      });

      const savedOtp = await this.otpRepository.save(otp);

      this.logger.log(
        `OTP generated for ${purpose}: ${email || phone} (ID: ${savedOtp.id})`,
      );

      // In production, send OTP via email or SMS
      // await this.sendOtpViaEmail(email, code);
      // await this.sendOtpViaSms(phone, code);

      return {
        id: savedOtp.id,
        expiresIn: 60, // seconds
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error generating OTP: ${message}`);
      throw new BadRequestException('Failed to generate OTP');
    }
  }

  /**
   * Verify OTP
   */
  async verifyOtp(
    otpId: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<{ verified: boolean; userId?: string; email?: string; phone?: string }> {
    try {
      const otp = await this.otpRepository.findOne({
        where: { id: otpId },
      });

      if (!otp) {
        throw new BadRequestException('OTP not found');
      }

      // Check if OTP is expired
      if (new Date() > otp.expiresAt) {
        otp.status = OtpStatus.EXPIRED;
        await this.otpRepository.save(otp);
        throw new BadRequestException('OTP has expired');
      }

      // Check if OTP is already verified
      if (otp.status === OtpStatus.VERIFIED) {
        throw new BadRequestException('OTP already used');
      }

      // Check if max attempts exceeded
      if (otp.attempts >= otp.maxAttempts) {
        otp.status = OtpStatus.FAILED;
        await this.otpRepository.save(otp);
        throw new BadRequestException('Maximum OTP attempts exceeded');
      }

      // Verify code
      if (otp.code !== code) {
        otp.attempts += 1;
        await this.otpRepository.save(otp);
        throw new BadRequestException('Invalid OTP code');
      }

      // Mark as verified
      otp.status = OtpStatus.VERIFIED;
      otp.verifiedAt = new Date();
      await this.otpRepository.save(otp);

      this.logger.log(`OTP verified for ${purpose}: ${otp.email || otp.phone}`);

      return {
        verified: true,
        userId: otp.userId,
        email: otp.email,
        phone: otp.phone,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error verifying OTP: ${message}`);
      throw error;
    }
  }

  /**
   * Check if email is verified via OTP
   */
  async isEmailVerified(email: string): Promise<boolean> {
    try {
      const verifiedOtp = await this.otpRepository.findOne({
        where: {
          email,
          purpose: OtpPurpose.EMAIL_VERIFICATION,
          status: OtpStatus.VERIFIED,
        },
        order: { verifiedAt: 'DESC' },
      });

      return !!verifiedOtp;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking email verification: ${message}`);
      return false;
    }
  }

  /**
   * Check if phone is verified via OTP
   */
  async isPhoneVerified(phone: string): Promise<boolean> {
    try {
      const verifiedOtp = await this.otpRepository.findOne({
        where: {
          phone,
          purpose: OtpPurpose.PHONE_VERIFICATION,
          status: OtpStatus.VERIFIED,
        },
        order: { verifiedAt: 'DESC' },
      });

      return !!verifiedOtp;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking phone verification: ${message}`);
      return false;
    }
  }

  /**
   * Get pending OTP for user
   */
  async getPendingOtp(
    purpose: OtpPurpose,
    email?: string,
    phone?: string,
  ): Promise<Otp | null> {
    try {
      const otp = await this.otpRepository.findOne({
        where: {
          purpose,
          email,
          phone,
          status: OtpStatus.PENDING,
          expiresAt: LessThan(new Date()),
        },
      });

      return otp || null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting pending OTP: ${message}`);
      return null;
    }
  }

  /**
   * Clean up expired OTPs
   */
  async cleanupExpiredOtps(): Promise<number> {
    try {
      const result = await this.otpRepository.delete({
        expiresAt: LessThan(new Date(Date.now() - 24 * 60 * 60 * 1000)), // Older than 24 hours
      });

      this.logger.log(`Cleaned up ${result.affected} expired OTPs`);
      return result.affected || 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error cleaning up expired OTPs: ${message}`);
      return 0;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private generateRandomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async invalidatePreviousOtps(
    purpose: OtpPurpose,
    email?: string,
    phone?: string,
    userId?: string,
  ): Promise<void> {
    try {
      const query = this.otpRepository
        .createQueryBuilder()
        .update(Otp)
        .set({ status: OtpStatus.EXPIRED })
        .where('purpose = :purpose', { purpose })
        .andWhere('status = :status', { status: OtpStatus.PENDING });

      if (email) {
        query.andWhere('email = :email', { email });
      }
      if (phone) {
        query.andWhere('phone = :phone', { phone });
      }
      if (userId) {
        query.andWhere('userId = :userId', { userId });
      }

      await query.execute();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error invalidating previous OTPs: ${message}`);
    }
  }

  // In production, implement these methods to send OTP via email/SMS
  // private async sendOtpViaEmail(email: string, code: string): Promise<void> {
  //   // Use email service to send OTP
  // }

  // private async sendOtpViaSms(phone: string, code: string): Promise<void> {
  //   // Use SMS service (Twilio, etc.) to send OTP
  // }
}
