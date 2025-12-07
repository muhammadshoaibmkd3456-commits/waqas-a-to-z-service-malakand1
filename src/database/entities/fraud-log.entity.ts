import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

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

@Entity('fraud_logs')
@Index(['ipAddress'])
@Index(['email'])
@Index(['phone'])
@Index(['reason'])
@Index(['createdAt'])
@Index(['ipAddress', 'createdAt'])
export class FraudLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 45 })
  ipAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: FraudReason })
  reason: FraudReason;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @Column({ type: 'integer', default: 0 })
  fraudScore: number;

  @Column({ type: 'boolean', default: false })
  resolved: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resolvedBy: string;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  // Optional: Link to user if account was created
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  userId: string;
}
