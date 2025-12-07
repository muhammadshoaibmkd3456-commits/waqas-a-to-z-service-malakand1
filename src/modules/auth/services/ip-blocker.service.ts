import { Injectable, Logger } from '@nestjs/common';

export interface BlockedIpRecord {
  ipAddress: string;
  reason: string;
  blockedAt: Date;
  unblockAt: Date;
  isActive: boolean;
}

@Injectable()
export class IpBlockerService {
  private readonly logger = new Logger(IpBlockerService.name);
  
  // In production, use Redis for distributed caching
  private blockedIps = new Map<string, BlockedIpRecord>();

  /**
   * Block an IP address
   */
  blockIp(
    ipAddress: string,
    reason: string,
    durationHours: number = 24,
  ): BlockedIpRecord {
    try {
      const blockedAt = new Date();
      const unblockAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

      const record: BlockedIpRecord = {
        ipAddress,
        reason,
        blockedAt,
        unblockAt,
        isActive: true,
      };

      this.blockedIps.set(ipAddress, record);

      this.logger.warn(
        `IP blocked: ${ipAddress} for ${durationHours}h - Reason: ${reason}`,
      );

      return record;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error blocking IP: ${message}`);
      throw error;
    }
  }

  /**
   * Check if IP is blocked
   */
  isIpBlocked(ipAddress: string): boolean {
    try {
      const record = this.blockedIps.get(ipAddress);

      if (!record) {
        return false;
      }

      // Check if block has expired
      if (new Date() > record.unblockAt) {
        this.blockedIps.delete(ipAddress);
        this.logger.log(`IP unblocked (expired): ${ipAddress}`);
        return false;
      }

      return record.isActive;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking if IP is blocked: ${message}`);
      return false;
    }
  }

  /**
   * Get block record for IP
   */
  getBlockRecord(ipAddress: string): BlockedIpRecord | null {
    try {
      const record = this.blockedIps.get(ipAddress);

      if (!record) {
        return null;
      }

      // Check if block has expired
      if (new Date() > record.unblockAt) {
        this.blockedIps.delete(ipAddress);
        return null;
      }

      return record;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting block record: ${message}`);
      return null;
    }
  }

  /**
   * Unblock an IP address
   */
  unblockIp(ipAddress: string): boolean {
    try {
      const deleted = this.blockedIps.delete(ipAddress);

      if (deleted) {
        this.logger.log(`IP unblocked: ${ipAddress}`);
      }

      return deleted;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error unblocking IP: ${message}`);
      return false;
    }
  }

  /**
   * Get all blocked IPs
   */
  getAllBlockedIps(): BlockedIpRecord[] {
    try {
      const now = new Date();
      const activeBlocks: BlockedIpRecord[] = [];

      for (const [ip, record] of this.blockedIps.entries()) {
        if (now <= record.unblockAt) {
          activeBlocks.push(record);
        } else {
          this.blockedIps.delete(ip);
        }
      }

      return activeBlocks;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting all blocked IPs: ${message}`);
      return [];
    }
  }

  /**
   * Clear all expired blocks
   */
  clearExpiredBlocks(): number {
    try {
      const now = new Date();
      let clearedCount = 0;

      for (const [ip, record] of this.blockedIps.entries()) {
        if (now > record.unblockAt) {
          this.blockedIps.delete(ip);
          clearedCount++;
        }
      }

      if (clearedCount > 0) {
        this.logger.log(`Cleared ${clearedCount} expired IP blocks`);
      }

      return clearedCount;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error clearing expired blocks: ${message}`);
      return 0;
    }
  }
}
