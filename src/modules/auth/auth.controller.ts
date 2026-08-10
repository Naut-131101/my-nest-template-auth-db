import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { SessionContext } from '../../auth/auth.types';
import { ChangePasswordDto } from '../../auth/dto/change-password.dto';
import { LoginDto } from '../../auth/dto/login.dto';
import { RefreshTokenDto } from '../../auth/dto/refresh-token.dto';
import { RegisterDto } from '../../auth/dto/register.dto';

import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from '../../auth/auth.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditAction } from '../audit-logs/decorators/audit-action.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @AuditAction('auth.register')
  register(@Body() dto: RegisterDto, @Req() request: Request) {
    return this.authService.register(dto, this.getSessionContext(request));
  }

  @Post('login')
  @Public()
  @AuditAction('auth.login')
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.authService.login(dto, this.getSessionContext(request));
  }

  @Post('refresh')
  @Public()
  @AuditAction('auth.refresh')
  refresh(@Body() dto: RefreshTokenDto, @Req() request: Request) {
    return this.authService.refresh(
      dto.refreshToken,
      this.getSessionContext(request),
    );
  }

  @Post('change-password')
  @AuditAction('auth.change-password')
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @Post('logout')
  @AuditAction('auth.logout')
  logout(
    @CurrentUser('id') userId: string,
    @CurrentUser('sessionId') sessionId: string,
  ) {
    return this.authService.logout(userId, sessionId);
  }

  @Post('logout-all')
  @AuditAction('auth.logout-all')
  logoutAll(@CurrentUser('id') userId: string) {
    return this.authService.logoutAll(userId);
  }

  private getSessionContext(request: Request): SessionContext {
    return {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    };
  }
}
