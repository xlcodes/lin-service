import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@/core/redis/redis.service';
import { RedisClientType } from 'redis';
import { REDIS_CLIENT } from '@/core/common/constant';

describe('RedisService', () => {
  let service: RedisService;
  let mockRedisClient: jest.Mocked<RedisClientType>;
  let loggerSpy: jest.SpyInstance;

  // Constants
  const TEST_KEY = 'test-key';
  const TEST_VALUE = 'test-value';
  const FAILING_KEY = 'failing-key';
  const TTL_SECONDS = 60;
  const REDIS_ERROR = new Error('Redis operation failed');

  beforeEach(async () => {
    // Initialize mocks
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      expire: jest.fn(),
    } as unknown as jest.Mocked<RedisClientType>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: REDIS_CLIENT,
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    loggerSpy = jest.spyOn(service['logger'], 'error');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return value when key exists', async () => {
      mockRedisClient.get.mockResolvedValue(TEST_VALUE);

      const result = await service.get(TEST_KEY);

      expect(result).toBe(TEST_VALUE);
      expect(mockRedisClient.get).toHaveBeenCalledWith(TEST_KEY);
      expect(loggerSpy).not.toHaveBeenCalled();
    });

    it('should log error and return null when Redis operation fails', async () => {
      mockRedisClient.get.mockRejectedValue(REDIS_ERROR);

      const result = await service.get(FAILING_KEY);

      expect(result).toBeNull();
      expect(mockRedisClient.get).toHaveBeenCalledWith(FAILING_KEY);
      expect(loggerSpy).toHaveBeenCalledWith(REDIS_ERROR);
    });
  });

  describe('set', () => {
    it('should set value without TTL', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await service.set(TEST_KEY, TEST_VALUE);

      expect(result).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith(TEST_KEY, TEST_VALUE);
      expect(mockRedisClient.expire).not.toHaveBeenCalled();
    });

    it('should set value with TTL', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(true);

      const result = await service.set(TEST_KEY, TEST_VALUE, TTL_SECONDS);

      expect(result).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith(TEST_KEY, TEST_VALUE);
      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        TEST_KEY,
        TTL_SECONDS,
      );
    });

    it('should log error and return false when set fails', async () => {
      mockRedisClient.set.mockRejectedValue(REDIS_ERROR);

      const result = await service.set(FAILING_KEY, TEST_VALUE);

      expect(result).toBe(false);
      expect(loggerSpy).toHaveBeenCalledWith(REDIS_ERROR);
    });
  });

  describe('del', () => {
    it('should return true when deletion succeeds', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await service.del(TEST_KEY);

      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith(TEST_KEY);
    });

    it('should log error and return false when deletion fails', async () => {
      mockRedisClient.del.mockRejectedValue(REDIS_ERROR);

      const result = await service.del(FAILING_KEY);

      expect(result).toBe(false);
      expect(loggerSpy).toHaveBeenCalledWith(REDIS_ERROR);
    });
  });
});
