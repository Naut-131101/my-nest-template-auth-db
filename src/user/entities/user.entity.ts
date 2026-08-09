import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { UserStatus } from '../../common/enums/user-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

@Entity({ name: 'users' })
@Index('uq_users_email', ['email'], { unique: true })
@Index('uq_users_username', ['username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ type: 'varchar', length: 255 })
  declare email: string;

  @Column({ type: 'varchar', length: 50 })
  declare username: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  declare passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  declare role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  declare status: UserStatus;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  declare firstName: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  declare lastName: string | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  declare lastLoginAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  declare updatedAt: Date;

  @VersionColumn()
  declare version: number;
}
