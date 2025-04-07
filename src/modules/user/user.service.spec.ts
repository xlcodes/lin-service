import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { ResultCodeEnum } from '@/core/common/constant';
import { CaptchaService } from '@/core/captcha/captcha.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { md5 } from '@/core/utils/md5';

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
});
