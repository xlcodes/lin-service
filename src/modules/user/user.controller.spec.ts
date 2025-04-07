import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ResultData } from '@/core/utils/result';
import { ResultCodeEnum } from '@/core/common/constant';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    register: jest.fn(),
    login: jest.fn(),
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

    const mockUser = {
      username: 'test',
      password: '123456',
      uuid: 'test-uuid',
      code: '123456',
    };

    const res = await controller.register(mockUser);

    expect(res.message).toBe('用户注册成功');
    expect(mockUserService.register).toHaveBeenCalledWith(mockUser);
  });

  it('用户登录成功', async () => {
    mockUserService.login.mockResolvedValue(
      ResultData.ok(
        {
          token: 'test-token',
        },
        '用户登录成功',
      ),
    );

    const user = {
      username: 'test-user',
      password: 'test-pwd',
    };

    const res = await controller.login(user);

    expect(res).toEqual({
      code: ResultCodeEnum.success,
      message: '用户登录成功',
      data: { token: 'test-token' },
    });
  });
});
