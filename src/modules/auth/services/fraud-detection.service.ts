import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import * as dns from 'dns';
import * as util from 'util';
import { FraudLog } from '../../../database/entities/fraud-log.entity';

const dnsResolve = util.promisify(dns.resolveMx);

export enum FraudReason {
  FAKE_EMAIL = 'fake_email',
  DISPOSABLE_EMAIL = 'disposable_email',
  INVALID_MX_RECORD = 'invalid_mx_record',
  FAKE_PHONE = 'fake_phone',
  VOIP_NUMBER = 'voip_number',
  VIRTUAL_SIM = 'virtual_sim',
  INVALID_CARRIER = 'invalid_carrier',
  VPN_IP = 'vpn_ip',
  PROXY_IP = 'proxy_ip',
  TOR_IP = 'tor_ip',
  BLACKLISTED_IP = 'blacklisted_ip',
  HIGH_RISK_COUNTRY = 'high_risk_country',
  BRUTEFORCE_ATTEMPT = 'bruteforce_attempt',
  MULTIPLE_ACCOUNTS_SAME_IP = 'multiple_accounts_same_ip',
}

export interface FraudCheckResult {
  isFraud: boolean;
  fraudScore: number;
  reasons: FraudReason[];
  details: Record<string, any>;
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);
  
  // Disposable email domains
  private readonly disposableEmailDomains = new Set([
    'tempmail.com',
    'guerrillamail.com',
    '10minutemail.com',
    'mailinator.com',
    'throwaway.email',
    'temp-mail.org',
    'yopmail.com',
    'maildrop.cc',
    'trashmail.com',
    'fakeinbox.com',
    'temp-mail.io',
    'sharklasers.com',
    'spam4.me',
    'mailnesia.com',
    'tempmail.net',
  ]);

  // Blacklisted IP ranges (simplified - in production use a proper IP database)
  private readonly blacklistedIpRanges = [
    '192.0.2.0/24', // TEST-NET-1
    '198.51.100.0/24', // TEST-NET-2
    '203.0.113.0/24', // TEST-NET-3
  ];

  // High-risk countries (ISO country codes)
  private readonly highRiskCountries = new Set([
    'KP', // North Korea
    'IR', // Iran
    'SY', // Syria
    'CU', // Cuba
  ]);

  constructor(
    @InjectRepository(FraudLog)
    private fraudLogRepository: Repository<FraudLog>,
  ) {}

  /**
   * Comprehensive fraud check for email
   */
  async checkEmailFraud(email: string): Promise<FraudCheckResult> {
    const reasons: FraudReason[] = [];
    let fraudScore = 0;
    const details: Record<string, any> = {};

    try {
      // 1. Check for disposable email
      if (this.isDisposableEmail(email)) {
        reasons.push(FraudReason.DISPOSABLE_EMAIL);
        fraudScore += 40;
        details.disposableEmail = true;
      }

      // 2. Check MX records
      const hasMxRecord = await this.validateMxRecord(email);
      if (!hasMxRecord) {
        reasons.push(FraudReason.INVALID_MX_RECORD);
        fraudScore += 50;
        details.validMxRecord = false;
      } else {
        details.validMxRecord = true;
      }

      // 3. Check email format patterns
      if (this.hasSpamPatterns(email)) {
        reasons.push(FraudReason.FAKE_EMAIL);
        fraudScore += 30;
        details.spamPatterns = true;
      }

      // 4. Check against external API (optional - requires API key)
      // const emailReputation = await this.checkEmailReputation(email);
      // if (emailReputation.isSpam) {
      //   reasons.push(FraudReason.FAKE_EMAIL);
      //   fraudScore += 20;
      // }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking email fraud: ${message}`);
    }

    return {
      isFraud: fraudScore >= 50,
      fraudScore: Math.min(fraudScore, 100),
      reasons,
      details,
    };
  }

  /**
   * Comprehensive fraud check for phone number
   */
  async checkPhoneFraud(phoneNumber: string, countryCode?: string): Promise<FraudCheckResult> {
    const reasons: FraudReason[] = [];
    let fraudScore = 0;
    const details: Record<string, any> = {};

    try {
      // 1. Basic format validation
      if (!this.isValidPhoneFormat(phoneNumber)) {
        reasons.push(FraudReason.FAKE_PHONE);
        fraudScore += 40;
        details.validFormat = false;
      } else {
        details.validFormat = true;
      }

      // 2. Check against carrier lookup API (requires external service)
      // In production, use services like Twilio Lookup API
      const carrierInfo = await this.checkCarrierInfo(phoneNumber);
      if (!carrierInfo.isValid) {
        reasons.push(FraudReason.INVALID_CARRIER);
        fraudScore += 50;
        details.carrierValid = false;
      } else {
        details.carrierValid = true;
        if (carrierInfo.isVoip) {
          reasons.push(FraudReason.VOIP_NUMBER);
          fraudScore += 60;
          details.isVoip = true;
        }
        if (carrierInfo.isVirtual) {
          reasons.push(FraudReason.VIRTUAL_SIM);
          fraudScore += 70;
          details.isVirtual = true;
        }
      }

      // 3. Check if number is recycled/inactive
      if (await this.isRecycledNumber(phoneNumber)) {
        reasons.push(FraudReason.FAKE_PHONE);
        fraudScore += 35;
        details.recycledNumber = true;
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking phone fraud: ${message}`);
    }

    return {
      isFraud: fraudScore >= 50,
      fraudScore: Math.min(fraudScore, 100),
      reasons,
      details,
    };
  }

  /**
   * Comprehensive fraud check for IP address
   */
  async checkIpFraud(ipAddress: string, email?: string): Promise<FraudCheckResult> {
    const reasons: FraudReason[] = [];
    let fraudScore = 0;
    const details: Record<string, any> = {};

    try {
      // 1. Check if IP is in blacklist
      if (this.isBlacklistedIp(ipAddress)) {
        reasons.push(FraudReason.BLACKLISTED_IP);
        fraudScore += 100;
        details.blacklisted = true;
      }

      // 2. Check for VPN/Proxy/TOR (requires external API)
      const ipReputation = await this.checkIpReputation(ipAddress);
      if (ipReputation.isVpn) {
        reasons.push(FraudReason.VPN_IP);
        fraudScore += 40;
        details.isVpn = true;
      }
      if (ipReputation.isProxy) {
        reasons.push(FraudReason.PROXY_IP);
        fraudScore += 40;
        details.isProxy = true;
      }
      if (ipReputation.isTor) {
        reasons.push(FraudReason.TOR_IP);
        fraudScore += 80;
        details.isTor = true;
      }

      // 3. Check country risk
      if (ipReputation.country && this.highRiskCountries.has(ipReputation.country)) {
        reasons.push(FraudReason.HIGH_RISK_COUNTRY);
        fraudScore += 50;
        details.highRiskCountry = ipReputation.country;
      }

      // 4. Check for repeated failed attempts from this IP
      const bruteforceDetected = await this.checkBruteforceAttempt(ipAddress, email || '');
      if (bruteforceDetected) {
        reasons.push(FraudReason.BRUTEFORCE_ATTEMPT);
        fraudScore += 60;
        details.bruteforceDetected = true;
      }

      // 5. Check for multiple accounts from same IP
      if (email) {
        const accountCount = await this.checkMultipleAccountsFromIp(ipAddress);
        if (accountCount >= 3) {
          reasons.push(FraudReason.MULTIPLE_ACCOUNTS_SAME_IP);
          fraudScore += 50;
          details.multipleAccounts = accountCount;
        }
      }

      details.country = ipReputation.country;
      details.isp = ipReputation.isp;
      details.ipAddress = ipAddress;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking IP fraud: ${message}`);
    }

    return {
      isFraud: fraudScore >= 50,
      fraudScore: Math.min(fraudScore, 100),
      reasons,
      details,
    };
  }

  /**
   * Check for bruteforce attempts
   */
  async checkBruteforceAttempt(
    ipAddress: string,
    email: string,
    timeWindowMinutes: number = 15,
  ): Promise<boolean> {
    try {
      // Count failed attempts in the last N minutes
      const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
      
      const attemptCount = await this.fraudLogRepository
        .createQueryBuilder('fraud')
        .where('fraud.ipAddress = :ipAddress', { ipAddress })
        .andWhere('fraud.reason = :reason', { reason: FraudReason.BRUTEFORCE_ATTEMPT })
        .andWhere('fraud.timestamp >= :timeThreshold', { timeThreshold })
        .getCount();

      return attemptCount >= 5; // More than 5 attempts in timeframe
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking bruteforce: ${message}`);
      return false;
    }
  }

  /**
   * Check for multiple accounts from same IP
   */
  async checkMultipleAccountsFromIp(ipAddress: string): Promise<number> {
    try {
      const count = await this.fraudLogRepository.count({
        where: {
          ipAddress,
          reason: FraudReason.MULTIPLE_ACCOUNTS_SAME_IP,
        },
      });
      return count;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking multiple accounts: ${message}`);
      return 0;
    }
  }

  /**
   * Log fraud attempt
   */
  async logFraudAttempt(
    ipAddress: string,
    email: string,
    phone: string,
    reason: FraudReason,
    details?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.fraudLogRepository.save({
        ipAddress,
        email,
        phone,
        reason,
        details,
        timestamp: new Date(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error logging fraud attempt: ${message}`);
    }
  }

  /**
   * Block IP address
   */
  async blockIp(ipAddress: string, reason: string, durationHours: number = 24): Promise<void> {
    try {
      const unblockTime = new Date(Date.now() + durationHours * 60 * 60 * 1000);
      // In production, store in Redis or database
      this.logger.warn(`IP blocked: ${ipAddress} until ${unblockTime} - Reason: ${reason}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error blocking IP: ${message}`);
    }
  }

  /**
   * Check if IP is blocked
   */
  async isIpBlocked(ipAddress: string): Promise<boolean> {
    try {
      // In production, check Redis or database
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking if IP is blocked: ${message}`);
      return false;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    return this.disposableEmailDomains.has(domain);
  }

  private async validateMxRecord(email: string): Promise<boolean> {
    try {
      const domain = email.split('@')[1];
      const mxRecords = await dnsResolve(domain);
      return mxRecords && mxRecords.length > 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.debug(`MX record validation failed for ${email}: ${message}`);
      return false;
    }
  }

  private hasSpamPatterns(email: string): boolean {
    const spamPatterns = [
      /^[0-9]+@/,
      /test/i,
      /fake/i,
      /spam/i,
      /noreply/i,
      /admin@admin/i,
      /[0-9]{10,}@/,
    ];
    return spamPatterns.some((pattern) => pattern.test(email));
  }

  private isValidPhoneFormat(phoneNumber: string): boolean {
    // Basic validation - at least 10 digits
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  }

  private async checkCarrierInfo(phoneNumber: string): Promise<{
    isValid: boolean;
    isVoip: boolean;
    isVirtual: boolean;
  }> {
    try {
      // In production, use Twilio Lookup API or similar
      // For now, return mock data
      return {
        isValid: true,
        isVoip: false,
        isVirtual: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking carrier info: ${message}`);
      return { isValid: false, isVoip: false, isVirtual: false };
    }
  }

  private async isRecycledNumber(phoneNumber: string): Promise<boolean> {
    try {
      // In production, check against carrier database
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking recycled number: ${message}`);
      return false;
    }
  }

  private isBlacklistedIp(ipAddress: string): boolean {
    // Simple check - in production use proper IP range library
    return this.blacklistedIpRanges.some((range) => this.ipInRange(ipAddress, range));
  }

  private ipInRange(ip: string, range: string): boolean {
    // Simplified IP range check - in production use proper library
    return false;
  }

  private async checkIpReputation(ipAddress: string): Promise<{
    isVpn: boolean;
    isProxy: boolean;
    isTor: boolean;
    country?: string;
    isp?: string;
  }> {
    try {
      // In production, use services like:
      // - IPQualityScore API
      // - AbuseIPDB API
      // - MaxMind GeoIP
      
      // Mock implementation
      return {
        isVpn: false,
        isProxy: false,
        isTor: false,
        country: 'US',
        isp: 'Unknown',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking IP reputation: ${message}`);
      return { isVpn: false, isProxy: false, isTor: false };
    }
  }

  private async checkEmailReputation(email: string): Promise<{ isSpam: boolean }> {
    try {
      // In production, use external API
      return { isSpam: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking email reputation: ${message}`);
      return { isSpam: false };
    }
  }
}
