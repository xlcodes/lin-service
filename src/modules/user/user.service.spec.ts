import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRegistrationToken } from '@nestjs/config/dist/utils/get-registration-token.util';
import { UserEntity } from '@/modules/user/entities/user.entity';

describe('UserService', () => {
  let service: UserService;

  // 模拟 UserEntity 操作对象
  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRegistrationToken(UserEntity),
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('用户注册', () => {

  })
});
