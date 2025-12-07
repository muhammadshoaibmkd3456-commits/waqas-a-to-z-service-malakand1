import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../database/entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
})
export class PaymentsModule {}
