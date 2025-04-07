import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ResultData } from '@/core/utils/result';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    register: jest.fn(),
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
    mockUserService.register.mockResolvedValue(
      ResultData.ok(null, '用户注册成功'),
    );
    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('用户注册成功', async () => {
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
});
