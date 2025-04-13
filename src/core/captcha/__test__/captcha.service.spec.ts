import { Test, TestingModule } from '@nestjs/testing';
import { CaptchaService } from '@/core/captcha/captcha.service';
import { RedisService } from '@/core/redis/redis.service';
import { CacheEnum } from '@/core/common/constant';
import { TEST_CODE, TEST_UUID, TEST_ERROR } from '@/test/test.constant';

describe('CaptchaService', () => {
  let service: CaptchaService;

  const testData = {
    uuid: TEST_UUID,
    code: TEST_CODE,
    errorCode: 'error-code',
    captchaExpiry: 5 * 60, // s
    emptyString: '',
  };

  const mockRedis = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const verifyRedisGetCalled = (uuid: string) => {
    expect(mockRedis.get).toHaveBeenCalledWith(
      `${CacheEnum.CAPTCHA_CODE_KEY}${uuid}`,
    );
  };

  const verifyRedisSetCalled = (uuid: string, code: string) => {
    expect(mockRedis.set).toHaveBeenCalledWith(
      `${CacheEnum.CAPTCHA_CODE_KEY}${uuid}`,
      code,
      testData.captchaExpiry,
    );
  };

  const verifyRedisDelCalled = (uuid: string) => {
    expect(mockRedis.del).toHaveBeenCalledWith(
      `${CacheEnum.CAPTCHA_CODE_KEY}${uuid}`,
    );
  };

  beforeEach(async () => {
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCode', () => {
    it('should return 500 error when failed to save captcha to redis', async () => {
      mockRedis.set.mockRejectedValue(TEST_ERROR);

      const result = await service.generateCode();

      expect(result).toEqual({
        code: 500,
        message: '生成验证码错误，请重试',
        data: undefined,
      });

      expect(mockRedis.set).toHaveBeenCalledTimes(1);
    });

    it('should return 200 status with uuid and image when captcha generation succeeds', async () => {
      mockRedis.set.mockImplementation((key, value) => {
        testData.code = value;
        return Promise.resolve(true);
      });

      const result = await service.generateCode();

      expect(result.code).toBe(200);
      expect(result.message).toBe('验证码生成成功');
      expect(result.data).toBeDefined();
      expect(result.data.uuid).toBeDefined();
      expect(result.data.img).toBeDefined();
      verifyRedisSetCalled(result.data.uuid, testData.code);
    });

    it('should generate code within reasonable time', async () => {
      mockRedis.set.mockResolvedValue(true);
      const start = Date.now();

      await service.generateCode();

      expect(Date.now() - start).toBeLessThan(100); // Should complete in less than 100ms
    });
  });

  describe('verify', () => {
    it('should return false when code does not match stored value', async () => {
      mockRedis.get.mockResolvedValue(testData.code);

      const result = await service.verify(testData.errorCode, testData.uuid);

      expect(result).toBe(false);
      verifyRedisGetCalled(testData.uuid);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should return false when no code is found for the uuid', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.verify(testData.code, testData.uuid);

      expect(result).toBe(false);
      verifyRedisGetCalled(testData.uuid);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should return true and delete key when code matches', async () => {
      mockRedis.get.mockResolvedValue(testData.code);
      mockRedis.del.mockResolvedValue(true);

      const result = await service.verify(testData.code, testData.uuid);

      expect(result).toBe(true);
      verifyRedisGetCalled(testData.uuid);
      verifyRedisDelCalled(testData.uuid);
    });

    it('should return false when redis get operation fails', async () => {
      mockRedis.get.mockRejectedValue(TEST_ERROR);

      const result = await service.verify(testData.code, testData.uuid);

      expect(result).toBe(false);
      verifyRedisGetCalled(testData.uuid);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should return false when delete operation fails after successful verification', async () => {
      mockRedis.get.mockResolvedValue(testData.code);
      mockRedis.del.mockRejectedValue(TEST_ERROR);

      const result = await service.verify(testData.code, testData.uuid);

      expect(result).toBe(false);
      verifyRedisGetCalled(testData.uuid);
      verifyRedisDelCalled(testData.uuid);
    });

    it('should return false when empty code is provided', async () => {
      const result = await service.verify(testData.emptyString, testData.uuid);
      expect(result).toBe(false);
      expect(mockRedis.get).toHaveBeenCalled();
    });

    it('should return false when empty uuid is provided', async () => {
      const result = await service.verify(testData.code, testData.emptyString);
      expect(result).toBe(false);
      expect(mockRedis.get).toHaveBeenCalled();
    });

    it('should return false when both code and uuid are empty', async () => {
      const result = await service.verify(
        testData.emptyString,
        testData.emptyString,
      );
      expect(result).toBe(false);
      expect(mockRedis.get).toHaveBeenCalled();
    });
  });
});
