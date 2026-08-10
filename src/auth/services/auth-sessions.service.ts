import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthSession } from '../entities/auth-session.entity';

import { ConfigService } from '@nestjs/config/dist/config.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { randomUUID } from 'crypto';
import { User } from '../../user/entities/user.entity';
import { SessionContext, TokenPair } from '../auth.types';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';

@Injectable()
export class AuthSessionsService {
  constructor(
    @InjectRepository(AuthSession)
    private readonly sessionsRepository: Repository<AuthSession>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async createSession(user: User, context: SessionContext): Promise<TokenPair> {
    const sessionId = randomUUID();
    const tokens = await this.tokenService.createTokenPair(user, sessionId);
    const refreshTokenHash = await this.passwordService.hash(
      tokens.refreshToken,
    );

    const session = this.sessionsRepository.create({
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      expiresAt: this.calculateRefreshExpiration(),
      revokedAt: null,
      lastUsedAt: null,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent?.slice(0, 500) ?? null,
    });

    await this.sessionsRepository.save(session);
    return tokens;
  }

  async rotateSession(
    user: User,
    payload: JwtPayload,
    presentedRefreshToken: string,
    context: SessionContext,
  ): Promise<TokenPair> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(AuthSession);
      const session = await repository
        .createQueryBuilder('session')
        .setLock('pessimistic_write')
        .where('session.id = :sessionId', { sessionId: payload.sessionId })
        .andWhere('session.userId = :userId', { userId: user.id })
        .getOne();

      if (
        !session ||
        session.revokedAt !== null ||
        session.expiresAt.getTime() <= Date.now()
      ) {
        throw new UnauthorizedException('Auth session không hợp lệ');
      }

      const tokenMatches = await this.passwordService.verify(
        session.refreshTokenHash,
        presentedRefreshToken,
      );

      if (!tokenMatches) {
        throw new UnauthorizedException(
          'Refresh token đã được sử dụng hoặc thu hồi',
        );
      }

      const tokens = await this.tokenService.createTokenPair(user, session.id);
      session.refreshTokenHash = await this.passwordService.hash(
        tokens.refreshToken,
      );
      session.expiresAt = this.calculateRefreshExpiration();
      session.lastUsedAt = new Date();
      session.ipAddress = context.ipAddress ?? session.ipAddress;
      session.userAgent = context.userAgent?.slice(0, 500) ?? session.userAgent;

      await repository.save(session);
      return tokens;
    });
  }

  async isActive(sessionId: string, userId: string): Promise<boolean> {
    const count = await this.sessionsRepository.count({
      where: {
        id: sessionId,
        userId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });

    return count === 1;
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    await this.sessionsRepository.update(
      { id: sessionId, userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.sessionsRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private calculateRefreshExpiration(): Date {
    const ttlSeconds = this.configService.getOrThrow<number>(
      'JWT_REFRESH_EXP_SECONDS',
    );
    return new Date(Date.now() + ttlSeconds * 1000);
  }
}
