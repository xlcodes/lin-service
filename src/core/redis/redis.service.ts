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
   * @return {string | null} 获取到的值
   */
  async get(key: string): Promise<string | null> {
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
   * @return {boolean} 是否成功
   */
  async set(
    key: string,
    value: string | number,
    ttl?: number,
  ): Promise<boolean> {
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
   * @return {boolean} 是否成功
   */
  async del(key: string): Promise<boolean> {
    try {
      await this.redisClient.del(key);
      return true;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  /**
   * 设置哈希值
   * @param key 对应键
   * @param field 哈希字段
   * @param value 设置的值
   * @return {boolean} 是否成功
   * @example await redisService.hSet('user:1000', 'name', 'Alice');
   */
  async hashSet(
    key: string,
    field: string,
    value: string | number,
  ): Promise<boolean> {
    try {
      await this.redisClient.hSet(key, field, value);
      return true;
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  /**
   * 获取哈希值
   * @param key 对应键
   * @param field 哈希字段
   * @return {string | null} 获取到的值
   * @example await redisService.hGet('user:1000', 'name'); // 返回 "Alice"
   */
  async hashGet(key: string, field: string): Promise<string | null> {
    try {
      return await this.redisClient.hGet(key, field);
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  /**
   * 删除哈希值
   * @param key 对应键
   * @param field 哈希字段
   * @return {boolean} 是否成功
   * @example await redisService.hDel('user:1000', 'age');
   */
  async hashDel(key: string, field: string): Promise<boolean> {
    try {
      await this.redisClient.hDel(key, field);
      return true;
    } catch (err) {
      this.logger.error(err);
      return false;
    }
  }
}
