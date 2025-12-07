import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Version,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Version('1')
  async register(@Body() registerDto: RegisterDto, @Request() req) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.authService.register(registerDto, ipAddress);
  }

  @Post('signin')
  @Version('1')
  async signin(@Body() loginDto: LoginDto, @Request() req) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.authService.signin(loginDto, ipAddress);
  }

  @Post('login')
  @Version('1')
  async login(@Body() loginDto: LoginDto, @Request() req) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.authService.login(loginDto, ipAddress);
  }

  @Post('refresh')
  @Version('1')
  async refresh(@Body() { refreshToken }: { refreshToken: string }) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async logout(@Request() req) {
    return this.authService.logout(req.user.sub);
  }

  @Get('mfa/setup')
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async setupMfa(@Request() req) {
    return this.authService.setupMfa(req.user.sub);
  }

  @Post('mfa/confirm')
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async confirmMfa(
    @Request() req,
    @Body() { mfaCode, secret }: { mfaCode: string; secret: string },
  ) {
    return this.authService.confirmMfa(req.user.sub, mfaCode, secret);
  }
}
