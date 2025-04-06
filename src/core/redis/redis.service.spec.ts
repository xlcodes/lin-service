import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@/core/redis/redis.service';
import { RedisClientType } from 'redis';
import { Logger } from '@nestjs/common';
import { REDIS_CLIENT } from '@/core/common/constant';

describe('RedisService', () => {
  let service: RedisService;
  let mockRedisClient: jest.Mocked<RedisClientType>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      expire: jest.fn(),
    } as unknown as jest.Mocked<RedisClientType>;

    mockLogger = {
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: REDIS_CLIENT,
          useValue: mockRedisClient,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('RedisService 应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('字符串获取方法：get', () => {
    it('当 key 存在的时候返回对应的值', async () => {
      mockRedisClient.get.mockResolvedValue('test-value');

      const result = await service.get('test-key');
      expect(result).toBe('test-value');
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('当 key 不存在的时候返回 null', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('redis 服务异常的时候记录日志并且返回 null', async () => {
      const error = new Error('Redis get error');
      mockRedisClient.get.mockRejectedValueOnce(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.get('failing-key');
      expect(result).toBeNull();
      expect(loggerSpy).toHaveBeenCalledWith(error);

      expect(mockRedisClient.get).toHaveBeenCalledWith('failing-key');
    });

    it('key 为空的时候也应该处理，并且返回 null', async () => {
      const mockKey = '';
      mockRedisClient.get.mockResolvedValue(null);
      const result = await service.get(mockKey);
      expect(result).toBeNull();
    });
  });

  describe('字符串设置方法：set', () => {
    it('设置永久缓存值正确设置', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await service.set('test-key', 'test-value');
      expect(result).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        'test-value',
      );
      expect(mockRedisClient.expire).not.toHaveBeenCalled();
    });

    it('指定有效期的缓存值正确设置', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(true);

      const result = await service.set('test-key', 'test-value', 60);
      expect(result).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        'test-value',
      );
      expect(mockRedisClient.expire).toHaveBeenCalledWith('test-key', 60);
    });

    it('缓存值为 number 设置符合预期', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await service.set('numeric-key', 123);
      expect(result).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith('numeric-key', 123);
    });

    it('redis连接异常记录日志并返回 false', async () => {
      const error = new Error('Redis set failed');
      mockRedisClient.set.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.set('failing-key', 'value');
      expect(result).toBe(false);
      expect(loggerSpy).toHaveBeenCalledWith(error);
    });

    it('设置永久缓存的时候，redis连接异常记录日志并返回 false', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      const expireError = new Error('Expire failed');
      mockRedisClient.expire.mockRejectedValue(expireError);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.set('expire-fail-key', 'value', 60);
      expect(result).toBe(false);
      expect(loggerSpy).toHaveBeenCalledWith(expireError);
    });
  });

  describe('字符串删除方法', () => {
    it('成功删除存在的 key 时返回 true', async () => {
      mockRedisClient.del.mockResolvedValue(1); // Redis DEL 命令返回删除的数量

      const result = await service.del('existing-key');
      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('existing-key');
    });

    it('删除不存在的 key 时返回 false', async () => {
      mockRedisClient.del.mockResolvedValue(0); // 表示没有删除任何 key

      const result = await service.del('non-existent-key');
      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('non-existent-key');
    });

    it('Redis 服务异常时记录日志并返回 false', async () => {
      const error = new Error('Redis connection failed');
      mockRedisClient.del.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.del('failing-key');
      expect(result).toBe(false);
      expect(loggerSpy).toHaveBeenCalledWith(error);
      expect(mockRedisClient.del).toHaveBeenCalledWith('failing-key');
    });

    it('传入空 key 时也正确处理并返回 true', async () => {
      mockRedisClient.del.mockResolvedValue(0);

      const result = await service.del('');
      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('');
    });
  });
});
