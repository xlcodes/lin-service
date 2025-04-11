import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { ResultCodeEnum } from '@/core/common/constant';
import { CreateRoleDto } from '@/modules/role/dto/create-role.dto';

describe('RoleController', () => {
  let controller: RoleController;

  const TEST_ROLE_ID = 1;
  const TEST_ROLE_NAME = 'test-role';
  const TEST_ROLE_DESC = 'test-role-desc';
  const TEST_DATE = new Date('2025-04-01 12:00:00');
  const TEST_USER_ID = 5;
  const TEST_PAGE_NO = 1;
  const TEST_PAGE_SIZE = 5;
  const TEST_TOTAL = 5;

  const createMockRole = (options = {}) => {
    return {
      name: TEST_ROLE_NAME,
      description: TEST_ROLE_DESC,
      createdAt: TEST_DATE,
      updatedAt: TEST_DATE,
      deletedAt: null,
      ...options,
    };
  };

  const mockRoleService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('分页查询', async () => {
    const mockRes = {
      code: ResultCodeEnum.success,
      message: '查询角色列表成功',
      data: {
        list: [
          createMockRole({ id: 1 }),
          createMockRole({ id: 2 }),
          createMockRole({ id: 3 }),
          createMockRole({ id: 4 }),
          createMockRole({ id: 5 }),
        ],
        pageInfo: {
          total: TEST_TOTAL,
          pageSize: TEST_PAGE_SIZE,
          pageNo: TEST_PAGE_NO,
        },
      },
    };

    mockRoleService.findAll.mockResolvedValue(mockRes);

    const result = await controller.findAll(
      TEST_PAGE_NO,
      TEST_PAGE_SIZE,
      TEST_USER_ID,
    );

    expect(result).toEqual(mockRes);
    expect(mockRoleService.findAll).toHaveBeenCalledWith(
      TEST_PAGE_NO,
      TEST_PAGE_SIZE,
      TEST_USER_ID,
    );
  });

  it('详情查询', async () => {
    const mockRole = createMockRole({ id: TEST_ROLE_ID });

    const mockRes = {
      code: ResultCodeEnum.success,
      message: `查询 ${TEST_ROLE_ID} 角色成功`,
      data: mockRole,
    };

    mockRoleService.findOne.mockResolvedValue(mockRes);

    const result = await controller.findOne(TEST_ROLE_ID, TEST_USER_ID);
    expect(result).toEqual(mockRes);
    expect(mockRoleService.findOne).toHaveBeenCalledWith(
      TEST_ROLE_ID,
      TEST_USER_ID,
    );
  });

  it('创建角色', async () => {
    const mockRole: CreateRoleDto = {
      name: TEST_ROLE_NAME,
      description: TEST_ROLE_DESC,
    };

    const mockRes = {
      code: ResultCodeEnum.success,
      message: '角色创建成功',
      data: null,
    };

    mockRoleService.create.mockResolvedValue(mockRes);

    const result = await controller.create(mockRole, TEST_USER_ID);

    expect(result).toEqual(mockRes);
    expect(mockRoleService.create).toHaveBeenCalledWith(mockRole, TEST_USER_ID);
  });

  it('修改角色', async () => {
    const mockRole = createMockRole({ id: TEST_ROLE_ID });
    const mockRes = {
      code: ResultCodeEnum.success,
      message: '角色修改成功',
      data: null,
    };

    mockRoleService.update.mockResolvedValue(mockRes);

    const result = await controller.update(
      TEST_ROLE_ID,
      mockRole,
      TEST_USER_ID,
    );

    expect(result).toEqual(mockRes);
    expect(mockRoleService.update).toHaveBeenCalledWith(
      TEST_ROLE_ID,
      mockRole,
      TEST_USER_ID,
    );
  });

  it('删除角色', async () => {
    const mockRes = {
      code: ResultCodeEnum.success,
      message: '角色删除成功',
      data: null,
    };

    mockRoleService.remove.mockResolvedValue(mockRes);

    const result = await controller.remove(TEST_ROLE_ID, TEST_USER_ID);

    expect(result).toEqual(mockRes);
    expect(mockRoleService.remove).toHaveBeenCalledWith(
      TEST_ROLE_ID,
      TEST_USER_ID,
    );
  });
});
