import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddSecurityEntities1733148000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create fraud_logs table
    await queryRunner.createTable(
      new Table({
        name: 'fraud_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'reason',
            type: 'enum',
            enum: [
              'fake_email',
              'disposable_email',
              'invalid_mx_record',
              'fake_phone',
              'voip_number',
              'virtual_sim',
              'invalid_carrier',
              'vpn_ip',
              'proxy_ip',
              'tor_ip',
              'blacklisted_ip',
              'high_risk_country',
              'bruteforce_attempt',
              'multiple_accounts_same_ip',
            ],
          },
          {
            name: 'details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'fraudScore',
            type: 'integer',
            default: 0,
          },
          {
            name: 'resolved',
            type: 'boolean',
            default: false,
          },
          {
            name: 'resolvedBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'resolutionNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'resolvedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes for fraud_logs
    await queryRunner.createIndex(
      'fraud_logs',
      new TableIndex({
        name: 'IDX_fraud_logs_ipAddress',
        columnNames: ['ipAddress'],
      }),
    );

    await queryRunner.createIndex(
      'fraud_logs',
      new TableIndex({
        name: 'IDX_fraud_logs_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'fraud_logs',
      new TableIndex({
        name: 'IDX_fraud_logs_phone',
        columnNames: ['phone'],
      }),
    );

    await queryRunner.createIndex(
      'fraud_logs',
      new TableIndex({
        name: 'IDX_fraud_logs_reason',
        columnNames: ['reason'],
      }),
    );

    await queryRunner.createIndex(
      'fraud_logs',
      new TableIndex({
        name: 'IDX_fraud_logs_createdAt',
        columnNames: ['createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'fraud_logs',
      new TableIndex({
        name: 'IDX_fraud_logs_ipAddress_createdAt',
        columnNames: ['ipAddress', 'createdAt'],
      }),
    );

    // Add foreign key for fraud_logs
    await queryRunner.createForeignKey(
      'fraud_logs',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Create otps table
    await queryRunner.createTable(
      new Table({
        name: 'otps',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '6',
          },
          {
            name: 'purpose',
            type: 'enum',
            enum: [
              'email_verification',
              'phone_verification',
              'password_reset',
              'login',
            ],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'verified', 'expired', 'failed'],
            default: "'pending'",
          },
          {
            name: 'attempts',
            type: 'integer',
            default: 0,
          },
          {
            name: 'maxAttempts',
            type: 'integer',
            default: 3,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'verifiedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes for otps
    await queryRunner.createIndex(
      'otps',
      new TableIndex({
        name: 'IDX_otps_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'otps',
      new TableIndex({
        name: 'IDX_otps_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'otps',
      new TableIndex({
        name: 'IDX_otps_phone',
        columnNames: ['phone'],
      }),
    );

    await queryRunner.createIndex(
      'otps',
      new TableIndex({
        name: 'IDX_otps_purpose',
        columnNames: ['purpose'],
      }),
    );

    await queryRunner.createIndex(
      'otps',
      new TableIndex({
        name: 'IDX_otps_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'otps',
      new TableIndex({
        name: 'IDX_otps_expiresAt',
        columnNames: ['expiresAt'],
      }),
    );

    await queryRunner.createIndex(
      'otps',
      new TableIndex({
        name: 'IDX_otps_createdAt',
        columnNames: ['createdAt'],
      }),
    );

    // Add foreign key for otps
    await queryRunner.createForeignKey(
      'otps',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop otps table
    await queryRunner.dropTable('otps', true);

    // Drop fraud_logs table
    await queryRunner.dropTable('fraud_logs', true);
  }
}
