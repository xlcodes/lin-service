import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '@/modules/user/user.controller';
import { UserService } from '@/modules/user/user.service';
import { ResultData } from '@/core/utils/result';
import { ResultCodeEnum } from '@/core/common/constant';
import { BadRequestException } from '@nestjs/common';
import { TEST_USER_NAME, TEST_UUID, TEST_CODE } from '@/test/test.constant';

describe('UserController', () => {
  let controller: UserController;

  const TEST_TOKEN = 'test-token';
  const TEST_USER_PWD = 'test-pwd';

  const createMockUser = (options = {}) => ({
    username: TEST_USER_NAME,
    password: TEST_USER_PWD,
    uuid: TEST_UUID,
    code: TEST_CODE,
    ...options,
  });

  const mockUserService = {
    register: jest.fn(),
    login: jest.fn(),
    loginWechat: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();
    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('用户注册成功', async () => {
    mockUserService.register.mockResolvedValue(
      ResultData.ok(null, '用户注册成功'),
    );

    const mockUser = createMockUser();

    const res = await controller.register(mockUser);

    expect(res.message).toBe('用户注册成功');
    expect(mockUserService.register).toHaveBeenCalledWith(mockUser);
  });

  it('用户登录成功', async () => {
    mockUserService.login.mockResolvedValue(
      ResultData.ok(
        {
          token: TEST_TOKEN,
        },
        '用户登录成功',
      ),
    );

    const res = await controller.login(createMockUser());

    expect(res).toEqual({
      code: ResultCodeEnum.success,
      message: '用户登录成功',
      data: { token: TEST_TOKEN },
    });
  });

  describe('wechatLogin', () => {
    it('微信用户登录', async () => {
      mockUserService.loginWechat.mockResolvedValue(
        ResultData.ok(
          {
            token: TEST_TOKEN,
          },
          '用户登录成功',
        ),
      );

      const res = await controller.wechatLogin(TEST_CODE);

      expect(res).toEqual({
        code: ResultCodeEnum.success,
        message: '用户登录成功',
        data: { token: TEST_TOKEN },
      });
    });

    it('微信用户登录 code 为空字符串', async () => {
      await expect(controller.wechatLogin('')).rejects.toThrow(
        new BadRequestException('code参数错误'),
      );
    });

    it('微信用户登录 code 为 undefined', async () => {
      await expect(controller.wechatLogin(undefined)).rejects.toThrow(
        new BadRequestException('code参数错误'),
      );
    });

    it('微信用户登录 code 为 null', async () => {
      await expect(controller.wechatLogin(null)).rejects.toThrow(
        new BadRequestException('code参数错误'),
      );
    });
  });
});
