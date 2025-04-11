import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { UserService } from '@/modules/user/user.service';
import { Logger } from '@nestjs/common';
import { RoleEntity } from '@/modules/role/entities/role.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('RoleService', () => {
  let service: RoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: UserEntity,
          useValue: {},
        },
        {
          provide: UserService,
          useValue: {},
        },
        {
          provide: Logger,
          useValue: {},
        },
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
