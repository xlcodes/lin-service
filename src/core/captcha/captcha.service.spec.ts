import { Test, TestingModule } from '@nestjs/testing';
import { CaptchaService } from './captcha.service';
import { RedisService } from '@/core/redis/redis.service';
import { CacheEnum } from '@/core/common/constant';

describe('CaptchaService', () => {
  let service: CaptchaService;

  // Constants
  const TEST_UUID = 'test-uuid';
  const TEST_CODE = 'test-code';
  const ERROR_CODE = 'error-code';
  const REDIS_ERROR = new Error('Redis operation failed');
  const CAPTCHA_EXPIRY = 300; // 5 minutes in seconds

  // Mock services
  const mockRedis = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    mockRedis.set.mockReset();
    mockRedis.get.mockReset();
    mockRedis.del.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaptchaService,
        {
          provide: RedisService,
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<CaptchaService>(CaptchaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCode', () => {
    it('should return error when failed to save captcha to redis', async () => {
      mockRedis.set.mockRejectedValue(REDIS_ERROR);

      const result = await service.generateCode();

      expect(result).toEqual({
        code: 500,
        message: '生成验证码错误，请重试',
        data: undefined,
      });
      expect(mockRedis.set).toHaveBeenCalledTimes(1);
    });

    it('should return success with captcha data when generation succeeds', async () => {
      mockRedis.set.mockResolvedValue(true);

      const result = await service.generateCode();

      expect(result.code).toBe(200);
      expect(result.message).toBe('验证码生成成功');
      expect(result.data).toBeDefined();
      expect((result.data as any).uuid).toBeDefined();
      expect((result.data as any).img).toBeDefined();

      // Verify redis set was called with correct expiry
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining(`${CacheEnum.CAPTCHA_CODE_KEY}`),
        expect.any(String),
        CAPTCHA_EXPIRY,
      );
    });
  });

  describe('verify', () => {
    it('should return false when code does not match stored value', async () => {
      mockRedis.get.mockResolvedValue(TEST_CODE);

      const result = await service.verify(ERROR_CODE, TEST_UUID);

      expect(result).toBe(false);
      expect(mockRedis.get).toHaveBeenCalledWith(
        `${CacheEnum.CAPTCHA_CODE_KEY}${TEST_UUID}`,
      );
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should return false when no code is found for the uuid', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.verify(TEST_CODE, TEST_UUID);

      expect(result).toBe(false);
      expect(mockRedis.get).toHaveBeenCalledWith(
        `${CacheEnum.CAPTCHA_CODE_KEY}${TEST_UUID}`,
      );
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should return true and delete key when code matches', async () => {
      mockRedis.get.mockResolvedValue(TEST_CODE);
      mockRedis.del.mockResolvedValue(true);

      const result = await service.verify(TEST_CODE, TEST_UUID);

      expect(result).toBe(true);
      expect(mockRedis.get).toHaveBeenCalledWith(
        `${CacheEnum.CAPTCHA_CODE_KEY}${TEST_UUID}`,
      );
      expect(mockRedis.del).toHaveBeenCalledWith(
        `${CacheEnum.CAPTCHA_CODE_KEY}${TEST_UUID}`,
      );
    });

    it('should return false when redis get operation fails', async () => {
      mockRedis.get.mockRejectedValue(REDIS_ERROR);

      const result = await service.verify(TEST_CODE, TEST_UUID);

      expect(result).toBe(false);
      expect(mockRedis.get).toHaveBeenCalledWith(
        `${CacheEnum.CAPTCHA_CODE_KEY}${TEST_UUID}`,
      );
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should still return true even if delete operation fails', async () => {
      mockRedis.get.mockResolvedValue(TEST_CODE);
      mockRedis.del.mockRejectedValue(REDIS_ERROR);

      const result = await service.verify(TEST_CODE, TEST_UUID);

      expect(result).toBe(false);
      expect(mockRedis.get).toHaveBeenCalledWith(
        `${CacheEnum.CAPTCHA_CODE_KEY}${TEST_UUID}`,
      );
      expect(mockRedis.del).toHaveBeenCalledWith(
        `${CacheEnum.CAPTCHA_CODE_KEY}${TEST_UUID}`,
      );
    });
  });
});
