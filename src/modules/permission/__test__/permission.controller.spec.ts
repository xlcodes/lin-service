import { Test, TestingModule } from '@nestjs/testing';
import { PermissionController } from '@/modules/permission/permission.controller';
import { PermissionService } from '@/modules/permission/permission.service';
import { ResultCodeEnum } from '@/core/common/constant';
import { TEST_PAGE_NO, TEST_PAGE_SIZE, TEST_TOTAL } from '@/test/test.constant';

describe('PermissionController', () => {
  let controller: PermissionController;

  const TEST_ID = 1;
  const TEST_NAME = 'system:test:create';
  const TEST_DESCRIPTION = 'test-description';
  const TEST_USER_ID = 5;
  const TEST_DATE = new Date('2025-04-01 12:00:00');

  const createMockPermission = (options = {}) => {
    return {
      name: TEST_NAME,
      description: TEST_DESCRIPTION,
      createdAt: TEST_DATE,
      updatedAt: TEST_DATE,
      deletedAt: null,
      ...options,
    };
  };

  const mockPermissionService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionController],
      providers: [
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    controller = module.get<PermissionController>(PermissionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('分页数据获取', async () => {
    const mockResult = {
      code: ResultCodeEnum.success,
      message: '查询权限成功',
      data: {
        list: [
          createMockPermission({ id: 1 }),
          createMockPermission({ id: 2 }),
          createMockPermission({ id: 3 }),
        ],
        pageInfo: {
          pageNo: TEST_PAGE_NO,
          pageSize: TEST_PAGE_SIZE,
          total: TEST_TOTAL,
        },
      },
    };

    mockPermissionService.findAll.mockResolvedValue(mockResult);

    const result = await controller.findAll(
      TEST_PAGE_NO,
      TEST_PAGE_SIZE,
      TEST_USER_ID,
    );

    expect(result).toEqual(mockResult);
    expect(mockPermissionService.findAll).toHaveBeenCalledWith(
      TEST_PAGE_NO,
      TEST_PAGE_SIZE,
      TEST_USER_ID,
    );
  });

  it('详情数据获取', async () => {
    const mockResult = {
      code: ResultCodeEnum.success,
      message: `查询 ${TEST_ID} 权限成功`,
      data: createMockPermission({ id: TEST_ID }),
    };

    mockPermissionService.findOne.mockResolvedValue(mockResult);

    const result = await controller.findOne(TEST_ID, TEST_USER_ID);

    expect(result).toEqual(mockResult);
    expect(mockPermissionService.findOne).toHaveBeenCalledWith(
      TEST_ID,
      TEST_USER_ID,
    );
  });

  it('创建权限', async () => {
    const mockParams = createMockPermission({ id: TEST_ID });

    const mockResult = {
      code: ResultCodeEnum.success,
      message: '创建权限成功',
      data: undefined,
    };

    mockPermissionService.create.mockResolvedValue(mockResult);

    const result = await controller.create(mockParams, TEST_USER_ID);

    expect(result).toEqual(mockResult);

    expect(mockPermissionService.create).toHaveBeenCalledWith(
      mockParams,
      TEST_USER_ID,
    );
  });

  it('修改权限', async () => {
    const mockParams = createMockPermission({ id: TEST_ID });

    const mockResult = {
      code: ResultCodeEnum.success,
      message: '修改权限成功',
      data: undefined,
    };

    mockPermissionService.update.mockResolvedValue(mockResult);

    const result = await controller.update(TEST_ID, mockParams, TEST_USER_ID);

    expect(result).toEqual(mockResult);
    expect(mockPermissionService.update).toHaveBeenCalledWith(
      TEST_ID,
      mockParams,
      TEST_USER_ID,
    );
  });

  it('删除权限', async () => {
    const mockResult = {
      code: ResultCodeEnum.success,
      message: '删除权限成功',
      data: undefined,
    };

    mockPermissionService.remove.mockResolvedValue(mockResult);

    const result = await controller.remove(TEST_ID, TEST_USER_ID);

    expect(result).toEqual(mockResult);
    expect(mockPermissionService.remove).toHaveBeenCalledWith(
      TEST_ID,
      TEST_USER_ID,
    );
  });
});
