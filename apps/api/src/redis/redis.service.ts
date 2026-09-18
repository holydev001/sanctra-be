import { Inject, Injectable } from '@nestjs/common';
import type { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { AppEnv } from '@sanctra/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(@Inject(ConfigService) private readonly config: ConfigService<AppEnv>) {
    this.client = new Redis(this.config.getOrThrow('REDIS_URL'), {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async setWithExpiry(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
  }

  async consume(key: string): Promise<boolean> {
    const value = await this.client.get(key);

    if (value === null) {
      return false;
    }

    await this.client.del(key);
    return true;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status !== 'end') {
      await this.client.quit();
    }
  }
}
