import { Test, TestingModule } from '@nestjs/testing';
import { CaptchaService } from './captcha.service';
import { RedisService } from '@/core/redis/redis.service';

describe('CaptchaService', () => {
  let service: CaptchaService;

  const mockRedis = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
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

  describe('生成验证码', () => {
    it('验证码生成失败', async () => {
      const mockError = new Error('生成验证码失败');
      mockRedis.set.mockImplementation(() => {
        throw mockError;
      });

      const res = await service.generateCode();

      expect(res.data).toBeUndefined();
      expect(res.code).toBe(500);
      expect(res.message).toBe('生成验证码错误，请重试');
    });

    it('验证码生成成功', async () => {
      mockRedis.set.mockReturnValue(true);
      const res = await service.generateCode();
      expect(res.code).toBe(200);
      expect(res.message).toBe('验证码生成成功');

      expect(mockRedis.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('校验验证码', () => {
    it('验证码校验失败', async () => {
      const testData = {
        code: 'test-code',
        uuid: 'test-uuid',
      };

      mockRedis.get.mockReturnValue(testData.code);

      const res = await service.verify('error-code', testData.uuid);
      expect(res).toBeFalsy();
      expect(mockRedis.get).toHaveBeenCalledTimes(1);
    });

    it('验证码校验成功', async () => {
      const testData = {
        code: 'test-code',
        uuid: 'test-uuid',
      };

      mockRedis.get.mockReturnValue(testData.code);

      const res = await service.verify(testData.code, testData.uuid);
      expect(res).toBeTruthy();
      expect(mockRedis.get).toHaveBeenCalledTimes(1);
      expect(mockRedis.del).toHaveBeenCalledTimes(1);
    });

    it('验证码校验异常', async () => {
      const mockError = new Error('生成验证码失败');
      const testData = {
        code: 'test-code',
        uuid: 'test-uuid',
      };
      mockRedis.get.mockImplementation(() => {
        throw mockError;
      });

      const res = await service.verify(testData.code, testData.uuid);

      expect(res).toBeFalsy();
      expect(mockRedis.get).toHaveBeenCalledTimes(1);
      expect(mockRedis.del).not.toBeCalled();
    });
  });
});
