import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { User } from '../../database/entities/user.entity';
import { FraudLog } from '../../database/entities/fraud-log.entity';
import { Otp } from '../../database/entities/otp.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SecurityController } from './controllers/security.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { FraudDetectionService } from './services/fraud-detection.service';
import { OtpService } from './services/otp.service';
import { IpBlockerService } from './services/ip-blocker.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, FraudLog, Otp]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your-secret-key'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, FraudDetectionService, OtpService, IpBlockerService],
  controllers: [AuthController, SecurityController],
  exports: [AuthService, FraudDetectionService, OtpService, IpBlockerService],
})
export class AuthModule {}
