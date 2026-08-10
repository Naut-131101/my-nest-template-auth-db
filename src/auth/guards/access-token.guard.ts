import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UserService } from '../../user/user.service';
import { AuthSessionsService } from '../services/auth-sessions.service';
import { TokenService } from '../services/token.service';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
    private readonly usersService: UserService,
    private readonly authSessionsService: AuthSessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);
    const payload = await this.tokenService.verifyAccessToken(token);

    const [user, sessionIsActive] = await Promise.all([
      this.usersService.findById(payload.sub),
      this.authSessionsService.isActive(payload.sessionId, payload.sub),
    ]);

    if (!user || !this.usersService.isActive(user) || !sessionIsActive) {
      throw new UnauthorizedException(
        'User hoặc auth session không còn hiệu lực',
      );
    }

    request.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      sessionId: payload.sessionId,
    };

    return true;
  }

  private extractBearerToken(request: Request): string {
    const authorization = request.headers.authorization;
    const [type, token] = authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Thiếu Bearer access token');
    }

    return token;
  }
}
