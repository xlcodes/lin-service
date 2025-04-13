import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@/core/redis/redis.service';
import { RedisClientType } from 'redis';
import { REDIS_CLIENT } from '@/core/common/constant';
import { TEST_ERROR } from '@/test/test.constant';

describe('RedisService', () => {
  let service: RedisService;
  let mockRedisClient: jest.Mocked<RedisClientType>;
  let loggerSpy: jest.SpyInstance;

  // Constants
  const TEST_KEY = 'test-key';
  const TEST_VALUE = 'test-value';
  const TEST_FIELD = 'test-field';
  const FAILING_KEY = 'failing-key';
  const TTL_SECONDS = 60;

  beforeEach(async () => {
    // Initialize mocks
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      expire: jest.fn(),
      hSet: jest.fn(),
      hGet: jest.fn(),
      hDel: jest.fn(),
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

  describe('typeof string', () => {
    describe('get', () => {
      it('should return value when key exists', async () => {
        mockRedisClient.get.mockResolvedValue(TEST_VALUE);

        const result = await service.get(TEST_KEY);

        expect(result).toBe(TEST_VALUE);
        expect(mockRedisClient.get).toHaveBeenCalledWith(TEST_KEY);
        expect(loggerSpy).not.toHaveBeenCalled();
      });

      it('should return null when key dose not exist', async () => {
        mockRedisClient.get.mockResolvedValue(null);

        const result = await service.get(TEST_KEY);

        expect(result).toBeNull();
        expect(mockRedisClient.get).toHaveBeenCalledWith(TEST_KEY);
        expect(loggerSpy).not.toHaveBeenCalled();
      });

      it('should log error and return null when Redis operation fails', async () => {
        mockRedisClient.get.mockRejectedValue(TEST_ERROR);

        const result = await service.get(FAILING_KEY);

        expect(result).toBeNull();
        expect(mockRedisClient.get).toHaveBeenCalledWith(FAILING_KEY);
        expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);
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
        mockRedisClient.set.mockRejectedValue(TEST_ERROR);

        const result = await service.set(FAILING_KEY, TEST_VALUE);

        expect(result).toBe(false);
        expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);
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
        mockRedisClient.del.mockRejectedValue(TEST_ERROR);

        const result = await service.del(FAILING_KEY);

        expect(result).toBe(false);
        expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);
      });
    });
  });

  describe('typeof hash', () => {
    describe('get', () => {
      it('should return value when key exists', async () => {
        mockRedisClient.hGet.mockResolvedValue(TEST_VALUE);

        const result = await service.hashGet(TEST_KEY, TEST_FIELD);

        expect(mockRedisClient.hGet).toHaveBeenCalledWith(TEST_KEY, TEST_FIELD);
        expect(result).toBe(TEST_VALUE);
        expect(loggerSpy).not.toHaveBeenCalled();
      });

      it('should return null when key does not exist', async () => {
        mockRedisClient.hGet.mockResolvedValue(null);

        const result = await service.hashGet(TEST_KEY, TEST_FIELD);

        expect(result).toBeNull();
        expect(loggerSpy).not.toHaveBeenCalled();
      });

      it('should log error and return null when Redis operation fails', async () => {
        mockRedisClient.hGet.mockRejectedValue(TEST_ERROR);

        const result = await service.hashGet(FAILING_KEY, TEST_FIELD);

        expect(result).toBeNull();
        expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);
      });
    });

    describe('set', () => {
      it('should set value', async () => {
        mockRedisClient.hSet.mockResolvedValue(1);

        const result = await service.hashSet(TEST_KEY, TEST_FIELD, TEST_VALUE);

        expect(result).toBe(true);
        expect(mockRedisClient.hSet).toHaveBeenCalledWith(
          TEST_KEY,
          TEST_FIELD,
          TEST_VALUE,
        );
        expect(loggerSpy).not.toHaveBeenCalled();
      });

      it('should log error and return false when set fails', async () => {
        mockRedisClient.hSet.mockRejectedValue(TEST_ERROR);

        const result = await service.hashSet(
          FAILING_KEY,
          TEST_FIELD,
          TEST_VALUE,
        );

        expect(result).toBe(false);
        expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);
      });
    });

    describe('del', () => {
      it('should return true when deletion succeeds', async () => {
        mockRedisClient.hDel.mockResolvedValue(1);
        const result = await service.hashDel(TEST_KEY, TEST_FIELD);

        expect(result).toBeTruthy();
        expect(mockRedisClient.hDel).toHaveBeenCalledWith(TEST_KEY, TEST_FIELD);
      });

      it('should log error and return false when deletion fails', async () => {
        mockRedisClient.hDel.mockRejectedValue(TEST_ERROR);

        const result = await service.hashDel(FAILING_KEY, TEST_FIELD);

        expect(result).toBeFalsy();
        expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);
      });
    });
  });
});
