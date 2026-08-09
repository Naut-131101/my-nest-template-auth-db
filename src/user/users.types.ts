import { UserRole } from '../common/enums/user-role.enum';
import { UserStatus } from '../common/enums/user-status.enum';

export interface CreateUserData {
  email: string;
  username: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface UserView {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  firstName: string | null;
  lastName: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
