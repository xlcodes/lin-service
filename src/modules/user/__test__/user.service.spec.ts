import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '@/modules/user/user.service';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { CacheEnum, ResultCodeEnum } from '@/core/common/constant';
import { CaptchaService } from '@/core/captcha/captcha.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { md5 } from '@/core/utils/md5';
import { RedisService } from '@/core/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AxiosService } from '@/core/axios/axios.service';
import { IsNull } from 'typeorm';
import {
  TEST_USER_NAME,
  TEST_UUID,
  TEST_OPENID,
  TEST_PWD,
  TEST_ERROR,
  TEST_DATE,
} from '@/test/test.constant';

describe('UserService', () => {
  let service: UserService;

  const TEST_UID = 1;
  const TEST_CAPTCHA_CODE = 'test-captcha-code';
  const TEST_TOKEN = 'test-token';
  const DEFAULT_AVATAR = '/images/def-avatar.png';
  const TOKEN_EXPIRY = '30m';

  const createMockUser = (overrides = {}) => ({
    uid: TEST_UID,
    username: TEST_USER_NAME,
    password: md5(TEST_PWD),
    nickName: TEST_USER_NAME,
    avatarUrl: DEFAULT_AVATAR,
    isAdmin: false,
    ...overrides,
  });

  const createRegisterDto = (overrides = {}) => ({
    username: TEST_USER_NAME,
    password: TEST_PWD,
    uuid: TEST_UUID,
    code: TEST_CAPTCHA_CODE,
    ...overrides,
  });

  const createLoginDto = (overrides = {}) => ({
    username: TEST_USER_NAME,
    password: TEST_PWD,
    ...overrides,
  });

  // Mock services
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
    get: jest.fn((key) => {
      switch (key) {
        case 'jwt_expires_in':
          return TOKEN_EXPIRY;
        case 'jwt_secret':
          return 'test-secret';
        case 'user_init_pwd':
          return '123456';
        default:
          return '';
      }
    }),
  };

  const mockAxios = {
    getWechatUserInfo: jest.fn(),
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(TEST_DATE);

    // Reset all mocks
    mockUserRepo.findOne.mockReset();
    mockUserRepo.findOneBy.mockReset();
    mockUserRepo.save.mockReset();
    mockUserRepo.update.mockReset();
    mockCaptcha.verify.mockReset().mockReturnValue(true);
    mockRedis.set.mockReset();
    mockRedis.get.mockReset();
    mockRedis.del.mockReset();
    mockJwt.sign.mockReset();
    mockJwt.verify.mockReset();
    mockConfig.get.mockReset().mockReturnValue(TOKEN_EXPIRY);
    mockAxios.getWechatUserInfo
      .mockReset()
      .mockReturnValue(createMockUser({ openid: TEST_OPENID }));

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
        {
          provide: AxiosService,
          useValue: mockAxios,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser 检测用户是否存在', () => {
    it('should return user not found error when user dose not exist', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.validateUser(TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('should return null when user exists', async () => {
      mockUserRepo.findOne.mockResolvedValue(createMockUser());

      const result = await service.validateUser(TEST_UID);

      expect(result).toBeNull();
    });
  });

  describe('createToken', () => {
    const tokenPayload = { userId: TEST_UID, uuid: TEST_UUID };

    it('should return null when failed to set token in redis', async () => {
      mockRedis.set.mockResolvedValue(false);

      const result = await service.createToken(tokenPayload);

      expect(result).toBeNull();
      expect(mockRedis.set).toHaveBeenCalledWith(
        `${CacheEnum.LOGIN_TOKEN_KEY}${TEST_UID}`,
        TEST_UUID,
        1800,
      );
    });

    it('should return token when successfully created', async () => {
      mockRedis.set.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue(TEST_TOKEN);

      const result = await service.createToken(tokenPayload);

      expect(result).toBe(TEST_TOKEN);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: TEST_UID, uuid: TEST_UUID },
        { expiresIn: TOKEN_EXPIRY },
      );
    });
  });

  describe('verifyToken', () => {
    it('should return null when token verification throws error', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw TEST_ERROR;
      });

      const result = await service.verifyToken(TEST_TOKEN);

      expect(result).toBeNull();
      expect(mockJwt.verify).toHaveBeenCalledWith(TEST_TOKEN, {
        secret: '30m',
      });
    });

    it('should return null when token payload is invalid', async () => {
      mockJwt.verify.mockReturnValue({ uuid: TEST_UUID }); // Missing userId

      const result = await service.verifyToken(TEST_TOKEN);

      expect(result).toBeNull();
    });

    it('should return null when token not found in redis', async () => {
      mockJwt.verify.mockReturnValue({ userId: TEST_UID, uuid: TEST_UUID });
      mockRedis.get.mockResolvedValue(null);

      const result = await service.verifyToken(TEST_TOKEN);

      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith(
        `${CacheEnum.LOGIN_TOKEN_KEY}${TEST_UID}`,
      );
    });

    it('should return null when user not found in database', async () => {
      mockJwt.verify.mockReturnValue({ userId: TEST_UID, uuid: TEST_UUID });
      mockRedis.get.mockResolvedValue(TEST_UUID);
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.verifyToken(TEST_TOKEN);

      expect(result).toBeNull();
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { uid: TEST_UID, deletedAt: IsNull() },
        select: { password: false },
      });
    });

    it('should return user when token is valid', async () => {
      const mockUser = createMockUser();
      mockJwt.verify.mockReturnValue({ userId: TEST_UID, uuid: TEST_UUID });
      mockRedis.get.mockResolvedValue(TEST_UUID);
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.verifyToken(TEST_TOKEN);

      expect(result).toEqual(mockUser);
    });
  });

  describe('register', () => {
    it('should return error when captcha verification fails', async () => {
      mockCaptcha.verify.mockReturnValue(false);

      const result = await service.register(createRegisterDto());

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '验证码校验失败',
        data: undefined,
      });
      expect(mockCaptcha.verify).toHaveBeenCalledWith(
        TEST_CAPTCHA_CODE,
        TEST_UUID,
      );
    });

    it('should return error when username already exists', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(createMockUser());

      const result = await service.register(createRegisterDto());

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户已存在',
        data: undefined,
      });
      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({
        username: TEST_USER_NAME,
      });
    });

    it('should return error when user creation fails', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      mockUserRepo.save.mockRejectedValue(TEST_ERROR);

      const result = await service.register(createRegisterDto());

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '用户注册失败',
        data: undefined,
      });
    });

    it('should register user successfully with encrypted password', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      mockUserRepo.save.mockResolvedValue(true);

      const result = await service.register(createRegisterDto());

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '用户注册成功',
        data: null,
      });
      expect(mockUserRepo.save).toHaveBeenCalledWith({
        username: TEST_USER_NAME,
        nickName: TEST_USER_NAME,
        password: md5(TEST_PWD),
        createdAt: TEST_DATE,
        updatedAt: TEST_DATE,
        avatarUrl: DEFAULT_AVATAR,
      });
    });
  });

  describe('login', () => {
    it('should return error when user not found', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);

      const result = await service.login(createLoginDto());

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
      expect(mockUserRepo.findOneBy).toHaveBeenCalledWith({
        username: TEST_USER_NAME,
        deletedAt: IsNull(),
      });
    });

    it('should return error when password is incorrect', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(
        createMockUser({ password: md5('wrong-password') }),
      );

      const result = await service.login(createLoginDto());

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '密码错误',
      });
    });

    it('should return token when login is successful', async () => {
      const mockUser = createMockUser();
      mockUserRepo.findOneBy.mockResolvedValue(mockUser);
      mockJwt.sign.mockReturnValue(TEST_TOKEN);
      mockRedis.set.mockResolvedValue(true);

      const result = await service.login(createLoginDto());

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '用户登录成功',
        data: { token: TEST_TOKEN },
      });
      expect(mockRedis.set).toHaveBeenCalledWith(
        `${CacheEnum.LOGIN_TOKEN_KEY}${TEST_UID}`,
        expect.any(String),
        1800,
      );
    });
  });

  describe('login by wechat', () => {
    it('should return error when openid not found', async () => {
      mockAxios.getWechatUserInfo.mockResolvedValue(null);

      const result = await service.loginWechat(TEST_CAPTCHA_CODE);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '微信登录失败',
        data: undefined,
      });
      expect(mockAxios.getWechatUserInfo).toHaveBeenCalledWith(
        TEST_CAPTCHA_CODE,
      );
    });

    it('should return token when login is successful', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(
        createMockUser({ openid: TEST_OPENID }),
      );
      mockJwt.sign.mockReturnValue(TEST_TOKEN);
      mockRedis.set.mockResolvedValue(true);

      const result = await service.loginWechat(TEST_CAPTCHA_CODE);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '微信用户登录成功',
        data: { token: TEST_TOKEN },
      });
    });

    it('should return error when openid user is not found and register user is error', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      mockUserRepo.save.mockResolvedValue(null);

      const result = await service.loginWechat(TEST_CAPTCHA_CODE);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '登录异常，请稍后再试！',
      });
    });

    it('should return token when openid user is not found and register user is success', async () => {
      mockUserRepo.findOneBy.mockResolvedValue(null);
      mockUserRepo.save.mockResolvedValue(
        createMockUser({ openid: TEST_OPENID }),
      );
      mockJwt.sign.mockReturnValue(TEST_TOKEN);
      mockRedis.set.mockResolvedValue(true);

      const result = await service.loginWechat(TEST_CAPTCHA_CODE);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '微信用户登录成功',
        data: { token: TEST_TOKEN },
      });
    });
  });

  describe('findByUserId', () => {
    it('should return null when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.findByUserId(TEST_UID);

      expect(result).toBeNull();
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { uid: TEST_UID, deletedAt: IsNull() },
        select: { password: false },
      });
    });

    it('should return user without password when found', async () => {
      const mockUser = createMockUser();
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUserId(TEST_UID);

      expect(result).toEqual(mockUser);
      expect(result.password).toBe(md5(TEST_PWD));
    });
  });

  describe('checkIsAdmin', () => {
    it('should return false when user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.checkIsAdmin(TEST_UID);

      expect(result).toBe(false);
    });

    it('should return false when user is not admin', async () => {
      mockUserRepo.findOne.mockResolvedValue(createMockUser());

      const result = await service.checkIsAdmin(TEST_UID);

      expect(result).toBe(false);
    });

    it('should return true when user is admin', async () => {
      mockUserRepo.findOne.mockResolvedValue(createMockUser({ isAdmin: true }));

      const result = await service.checkIsAdmin(TEST_UID);

      expect(result).toBe(true);
    });
  });

  describe('registerByWechat', () => {
    it('should return null when register user is error', async () => {
      mockUserRepo.save.mockImplementation(() => {
        throw TEST_ERROR;
      });

      const result = await service.registerByWechat(TEST_CAPTCHA_CODE);

      expect(result).toBeNull();
    });

    it('should register user successfully', async () => {
      const mockUser = createMockUser({ openid: TEST_OPENID });

      mockUserRepo.save.mockResolvedValue(mockUser);
      const time = Date.now();

      const result = await service.registerByWechat(TEST_OPENID);

      expect(result).toEqual(mockUser);

      expect(mockUserRepo.save).toHaveBeenCalledWith({
        openid: TEST_OPENID,
        nickName: `wechat_${time}`,
        username: `wechat_${time}`,
        avatarUrl: '',
        password: md5(mockConfig.get('user_init_pwd')),
        createdAt: TEST_DATE,
        updatedAt: TEST_DATE,
      });
    });
  });
});
