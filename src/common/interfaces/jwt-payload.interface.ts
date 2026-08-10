import { UserRole } from '../enums/user-role.enum';

export type TokenType = 'access' | 'refresh';

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  role: UserRole;
  sessionId: string;
  tokenType: TokenType;
  jti: string;
  iat?: number;
  exp?: number;
}
