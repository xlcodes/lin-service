import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { REDIS_CLIENT } from '@/core/common/constant';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  @Inject(REDIS_CLIENT)
  private readonly redisClient: RedisClientType;

  /**
   * 获取 redis 字符串
   * @param key
   */
  async get(key: string) {
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  /**
   * 设置 redis 字符串
   * @param key 键
   * @param value 值
   * @param ttl 有效时间，单位秒
   */
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

  /**
   * 删除 redis 字符串
   * @param key
   */
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
