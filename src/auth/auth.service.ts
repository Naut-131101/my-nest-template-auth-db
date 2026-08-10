import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { AuthSessionsService } from './services/auth-sessions.service';
import { RegisterDto } from './dto/register.dto';
import { AuthenticationResult, SessionContext } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { UserStatus } from '../common/enums/user-status.enum';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthSession } from './entities/auth-session.entity';
import { User } from '../user/entities/user.entity';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { DataSource, IsNull } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly authSessionsService: AuthSessionsService,
    private readonly dataSource: DataSource,
  ) {}

  async register(
    dto: RegisterDto,
    context: SessionContext,
  ): Promise<AuthenticationResult> {
    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    return this.issueSession(user, context);
  }

  async login(
    dto: LoginDto,
    context: SessionContext,
  ): Promise<AuthenticationResult> {
    const user = await this.usersService.findByIdentifierForAuthentication(
      dto.identifier,
    );

    const passwordMatches =
      user !== null &&
      (await this.passwordService.verify(user.passwordHash, dto.password));

    if (!user || !passwordMatches || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    const lastLoginAt = new Date();
    await this.usersService.updateLastLogin(user.id);
    user.lastLoginAt = lastLoginAt;

    return this.issueSession(user, context);
  }

  async refresh(
    refreshToken: string,
    context: SessionContext,
  ): Promise<AuthenticationResult> {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    const user = await this.getActiveUserFromPayload(payload);
    const tokens = await this.authSessionsService.rotateSession(
      user,
      payload,
      refreshToken,
      context,
    );

    return {
      ...tokens,
      user: this.usersService.toView(user),
    };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Password mới phải khác password hiện tại');
    }

    const user = await this.usersService.findByIdForAuthentication(userId);
    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    const currentPasswordMatches = await this.passwordService.verify(
      user.passwordHash,
      dto.currentPassword,
    );

    if (!currentPasswordMatches) {
      throw new UnauthorizedException('Password hiện tại không chính xác');
    }

    const newPasswordHash = await this.passwordService.hash(dto.newPassword);

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(User).update(user.id, {
        passwordHash: newPasswordHash,
      });
      await manager
        .getRepository(AuthSession)
        .update(
          { userId: user.id, revokedAt: IsNull() },
          { revokedAt: new Date() },
        );
    });

    return {
      message: 'Đổi password thành công; tất cả auth session đã bị thu hồi',
    };
  }

  async logout(
    userId: string,
    sessionId: string,
  ): Promise<{ message: string }> {
    await this.authSessionsService.revokeSession(sessionId, userId);
    return { message: 'Đăng xuất thành công' };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.authSessionsService.revokeAllUserSessions(userId);
    return { message: 'Đã đăng xuất khỏi tất cả thiết bị' };
  }

  private async issueSession(
    user: User,
    context: SessionContext,
  ): Promise<AuthenticationResult> {
    const tokens = await this.authSessionsService.createSession(user, context);
    return {
      ...tokens,
      user: this.usersService.toView(user),
    };
  }

  private async getActiveUserFromPayload(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !this.usersService.isActive(user)) {
      throw new UnauthorizedException(
        'User không tồn tại hoặc không hoạt động',
      );
    }
    return user;
  }
}
