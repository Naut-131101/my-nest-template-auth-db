import { UserView } from '../user/users.types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface SessionContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthenticationResult extends TokenPair {
  user: UserView;
}
