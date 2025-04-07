import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { ResultCodeEnum } from '@/core/common/constant';
import { CaptchaService } from '@/core/captcha/captcha.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { md5 } from '@/core/utils/md5';
import { RedisService } from '@/core/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('UserService', () => {
  let service: UserService;

  const mockUserRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockCaptcha = {
    verify: jest.fn().mockReturnValue(true),
  };

  const mockRedis = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockJwt = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockCaptcha.verify.mockReturnValue(true);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepo,
        },
        {
          provide: CaptchaService,
          useValue: mockCaptcha,
        },
        {
          provide: RedisService,
          useValue: mockRedis,
        },
        {
          provide: JwtService,
          useValue: mockJwt,
        },
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('用户注册', () => {
    const mockUser = {
      username: 'test',
      password: 'test-pwd',
      uuid: 'test-uuid',
      code: 'test-code',
    };

    beforeEach(() => {
      // 模拟时间
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-04-01 12:00:00'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('验证码校验失败', async () => {
      mockCaptcha.verify.mockReturnValue(false);

      const res = await service.register(mockUser);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '验证码校验失败',
        data: undefined,
      });

      expect(mockCaptcha.verify).toHaveBeenCalled();
    });

    it('当前用户已经存在', async () => {
      mockUserRepo.findOneBy.mockResolvedValue({
        username: 'test1',
      });

      const res = await service.register(mockUser);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户已存在',
        data: undefined,
      });

      expect(mockUserRepo.findOneBy).toHaveBeenCalled();
    });

    it('用户注册失败', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      const mockError = new Error('register custom error');

      mockUserRepo.save.mockImplementation(() => {
        throw mockError;
      });

      const res = await service.register({
        username: 'mock_user',
        password: 'test-pwd',
        uuid: 'test-uuid',
        code: 'test-code',
      });

      expect(res).toEqual({
        code: ResultCodeEnum.error,
        message: '用户注册失败',
        data: undefined,
      });

      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('用户注册成功', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);

      mockUserRepo.save.mockResolvedValue(true);

      const testUser = {
        username: 'mock_user',
        password: 'test-pwd',
        uuid: 'test-uuid',
        code: 'test-code',
      };

      const res = await service.register(testUser);
      expect(res).toEqual({
        code: ResultCodeEnum.success,
        message: '用户注册成功',
        data: null,
      });
      expect(mockUserRepo.save).toHaveBeenCalled();
      // 校验密码是否加密
      expect(mockUserRepo.save).toHaveBeenCalledWith({
        username: testUser.username,
        nickName: testUser.username,
        password: md5(testUser.password),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  });

  describe('用户登录', () => {
    it('指定登录用户不存在', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);

      const mockUser = {
        username: 'mock_user',
        password: 'test-pwd',
      };

      const res = await service.login(mockUser);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('登录密码错误', async () => {
      const testUser = {
        username: 'mock_user',
        password: 'test-pwd',
      };
      mockUserRepo.findOneBy.mockResolvedValue({
        username: testUser.username,
        password: 'test-pwd1',
      });

      const res = await service.login(testUser);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '密码错误',
      });
      expect(mockUserRepo.findOneBy).toHaveBeenCalled();
    });

    it('用户登录成功', async () => {
      const testUser = {
        uid: 'test-uid',
        username: 'test-user',
        password: 'test-pwd',
      };

      mockUserRepo.findOneBy.mockResolvedValue({
        uid: testUser.uid,
        username: testUser.username,
        password: md5(testUser.password),
      });
      mockConfig.get.mockReturnValue('30m');
      mockJwt.sign.mockReturnValue('mock-token');

      const res = await service.login(testUser);
      expect(res).toEqual({
        code: ResultCodeEnum.success,
        message: '用户登录成功',
        data: {
          token: 'mock-token',
        },
      });
    });
  });
});
