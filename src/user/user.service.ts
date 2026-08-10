/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from './entities/user.entity';
import { CreateUserData, UserView } from './users.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { UserStatus } from '../common/enums/user-status.enum';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { Brackets } from 'typeorm/browser/query-builder/Brackets.js';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  isActive(user: User): boolean {
    return user.status === UserStatus.ACTIVE;
  }

  toView(user: User): UserView {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      firstName: user.firstName,
      lastName: user.lastName,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }

  async create(data: CreateUserData): Promise<User> {
    const user = this.usersRepository.create({
      email: data.email.trim().toLowerCase(),
      username: data.username.trim().toLowerCase(),
      passwordHash: data.passwordHash,
      firstName: data.firstName?.trim() || null,
      lastName: data.lastName?.trim() || null,
      role: data.role ?? UserRole.USER,
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Email hoặc username đã tồn tại');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy user');
    }
    return user;
  }

  async findByIdForAuthentication(id: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findByIdentifierForAuthentication(
    identifier: string,
  ): Promise<User | null> {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = :identifier', {
        identifier: normalizedIdentifier,
      })
      .orWhere('LOWER(user.username) = :identifier', {
        identifier: normalizedIdentifier,
      })
      .getOne();
  }

  async list(query: ListUsersQueryDto) {
    const page = query.page;
    const limit = query.limit;
    const builder = this.usersRepository.createQueryBuilder('user');

    if (query.search) {
      const search = `%${query.search.trim().toLowerCase()}%`;
      builder.andWhere(
        new Brackets((where) => {
          where
            .where('LOWER(user.email) LIKE :search', { search })
            .orWhere('LOWER(user.username) LIKE :search', { search })
            .orWhere('LOWER(user.firstName) LIKE :search', { search })
            .orWhere('LOWER(user.lastName) LIKE :search', { search });
        }),
      );
    }

    if (query.role) {
      builder.andWhere('user.role = :role', { role: query.role });
    }

    if (query.status) {
      builder.andWhere('user.status = :status', { status: query.status });
    }

    const [items, total] = await builder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map((user) => this.toView(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<UserView> {
    const user = await this.findByIdOrFail(id);

    if (dto.username !== undefined) {
      user.username = dto.username.trim().toLowerCase();
    }
    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName.trim();
    }
    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName.trim();
    }

    try {
      return this.toView(await this.usersRepository.save(user));
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Username đã tồn tại');
      }
      throw error;
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { lastLoginAt: new Date() });
  }
}
