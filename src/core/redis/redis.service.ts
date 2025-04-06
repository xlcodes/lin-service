import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { REDIS_CLIENT } from '@/core/common/constant';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  @Inject(REDIS_CLIENT)
  private readonly redisClient: RedisClientType;

  async get(key: string) {
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  async set(key: string, value: string | number, ttl?: number) {
    try {
      await this.redisClient.set(key, value);

      if (ttl) {
        await this.redisClient.expire(key, ttl);
      }
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  async del(key: string) {
    try {
      await this.redisClient.del(key);
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }
}
