import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from '../../database/entities/document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Document])],
})
export class DocumentsModule {}
