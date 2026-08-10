import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  constructor(private readonly configService: ConfigService) {}

  hash(value: string): Promise<string> {
    return argon2.hash(value, {
      type: argon2.argon2id,
      memoryCost: this.configService.getOrThrow<number>('ARGON2_MEMORY_COST_KILOBYTE'),
      timeCost: this.configService.getOrThrow<number>('ARGON2_TIME_COST'),
      parallelism: this.configService.getOrThrow<number>('ARGON2_PARALLELISM_LANE'),
    });
  }

  async verify(hash: string, value: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, value);
    } catch {
      return false;
    }
  }
}
