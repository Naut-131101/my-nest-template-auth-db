import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity({ name: 'auth_sessions' })
@Index('idx_auth_sessions_user_id', ['userId'])
@Index('idx_auth_sessions_expires_at', ['expiresAt'])
export class AuthSession {
  @PrimaryGeneratedColumn('uuid')
  declare id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  declare userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  declare user: User;

  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 255 })
  declare refreshTokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  declare expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  declare revokedAt: Date | null;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  declare lastUsedAt: Date | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  declare ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  declare userAgent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  declare updatedAt: Date;
}
