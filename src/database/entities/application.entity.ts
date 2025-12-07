import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Document } from './document.entity';
import { Payment } from './payment.entity';
import { AuditLog } from './audit-log.entity';

export enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  MISSING_DOCS = 'missing_docs',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export enum ServiceType {
  POLICE_CLEARANCE = 'police_clearance',
  DOMICILE = 'domicile',
  PASSPORT = 'passport',
  NADRA = 'nadra',
  UNIVERSITY_ADMISSION = 'university_admission',
  VISA = 'visa',
  BUSINESS_REGISTRATION = 'business_registration',
}

@Entity('applications')
@Index(['userId'])
@Index(['status'])
@Index(['serviceType'])
@Index(['qrCode'], { unique: true })
@Index(['createdAt'])
@Index(['updatedAt'])
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: ServiceType })
  serviceType: ServiceType;

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.DRAFT })
  status: ApplicationStatus;

  @Column({ type: 'varchar', length: 36, unique: true })
  qrCode: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  referenceNumber: string;

  @Column({ type: 'jsonb', default: {} })
  formData: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'text', nullable: true })
  missingDocumentsNote: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Document, (doc) => doc.application)
  documents: Document[];

  @OneToMany(() => Payment, (payment) => payment.application)
  payments: Payment[];

  @OneToMany(() => AuditLog, (log) => log.application)
  auditLogs: AuditLog[];

  // Methods
  getProgress(): number {
    const totalSteps = 5;
    let completedSteps = 0;

    if (this.status !== ApplicationStatus.DRAFT) completedSteps++;
    if (this.formData && Object.keys(this.formData).length > 0) completedSteps++;
    if (this.documents && this.documents.length > 0) completedSteps++;
    if (this.paidAmount > 0) completedSteps++;
    if (this.status === ApplicationStatus.APPROVED) completedSteps++;

    return Math.round((completedSteps / totalSteps) * 100);
  }

  isPending(): boolean {
    return [
      ApplicationStatus.DRAFT,
      ApplicationStatus.SUBMITTED,
      ApplicationStatus.MISSING_DOCS,
      ApplicationStatus.UNDER_REVIEW,
    ].includes(this.status);
  }

  isPaymentPending(): boolean {
    return this.totalFee > this.paidAmount;
  }

  canBeSubmitted(): boolean {
    return (
      this.status === ApplicationStatus.DRAFT &&
      Object.keys(this.formData).length > 0 &&
      this.documents.length > 0
    );
  }
}
