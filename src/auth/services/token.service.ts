import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenPair } from '../auth.types';
import { ConfigService } from '@nestjs/config';
import {
  JwtPayload,
  TokenType,
} from '../../common/interfaces/jwt-payload.interface';
import { User } from '../../user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async createTokenPair(user: User, sessionId: string): Promise<TokenPair> {
    const accessTokenExpiresIn = this.configService.getOrThrow<number>(
      'JWT_ACCESS_EXP_SECONDS',
    );
    const refreshTokenExpiresIn = this.configService.getOrThrow<number>(
      'JWT_REFRESH_EXP_SECONDS',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.sign(user, sessionId, 'access', accessTokenExpiresIn),
      this.sign(user, sessionId, 'refresh', refreshTokenExpiresIn),
    ]);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
  }

  verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.verify(token, 'access');
  }

  verifyRefreshToken(token: string): Promise<JwtPayload> {
    return this.verify(token, 'refresh');
  }

  private sign(
    user: User,
    sessionId: string,
    tokenType: TokenType,
    expiresIn: number,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      sessionId,
      tokenType,
      jti: randomUUID(), // tao ra chuoi de dinh danh cho token, de tranh viec su dung lai token cu
    };

    return this.jwtService.signAsync(payload, {
      secret: this.getSecret(tokenType),
      expiresIn,
    });
  }

  private async verify(
    token: string,
    expectedTokenType: TokenType,
  ): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.getSecret(expectedTokenType),
      });

      if (
        payload.tokenType !== expectedTokenType ||
        !payload.sub ||
        !payload.sessionId
      ) {
        throw new UnauthorizedException('Token không đúng loại');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  private getSecret(tokenType: TokenType): string {
    return this.configService.getOrThrow<string>(
      tokenType === 'access' ? 'JWT_ACCESS_SECRET' : 'JWT_REFRESH_SECRET',
    );
  }
}
