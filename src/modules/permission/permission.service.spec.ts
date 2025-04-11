import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from './permission.service';
import { Logger } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PermissionEntity } from '@/modules/permission/entities/permission.entity';
import { UserService } from '@/modules/user/user.service';
import { ResultCodeEnum } from '@/core/common/constant';
import { IsNull } from 'typeorm';

describe('PermissionService', () => {
  let service: PermissionService;

  const TEST_ID = 1;
  const TEST_NAME = 'system:test:create';
  const TEST_DESCRIPTION = 'test-description';
  const TEST_DATE = new Date('2025-04-01 12:00:00');
  const TEST_USER_ID = 5;
  const TEST_USER = { id: TEST_USER_ID, name: 'test-user' };
  const TEST_PAGE_NO = 1;
  const TEST_PAGE_SIZE = 10;
  const TEST_TOTAL = 10;
  const TEST_ERROR = new Error('test-error');

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

  const mockPermissionData = () => {
    return {
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
    };
  };

  // Mock services
  const mockUserService = {
    findByUserId: jest.fn(),
  };

  const mockPermissionRepo = {
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(TEST_DATE);

    mockUserService.findByUserId.mockReset().mockReturnValue(TEST_USER);
    mockPermissionRepo.save.mockReset();
    mockPermissionRepo.findOne
      .mockReset()
      .mockResolvedValue(
        createMockPermission({ id: TEST_ID, deletedAt: null }),
      );
    mockPermissionRepo.findAndCount.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: getRepositoryToken(PermissionEntity),
          useValue: mockPermissionRepo,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create 创建权限', () => {
    it('should return not user when user not found', async () => {
      mockUserService.findByUserId.mockResolvedValue(null);

      const result = await service.create(createMockPermission(), TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });

      expect(mockUserService.findByUserId).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('should return error when permission already exists', async () => {
      mockPermissionRepo.findOne.mockResolvedValue(
        createMockPermission({ id: TEST_ID }),
      );

      const result = await service.create(createMockPermission(), TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前权限已存在',
        data: undefined,
      });
    });

    it('should return error when create permission failed', async () => {
      mockPermissionRepo.findOne.mockResolvedValue(null);

      mockPermissionRepo.save.mockImplementation(() => {
        throw TEST_ERROR;
      });

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.create(createMockPermission(), TEST_USER_ID);
      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '创建权限失败',
        data: undefined,
      });

      expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);
    });

    it('should create a new permission', async () => {
      mockPermissionRepo.findOne.mockResolvedValue(null);

      const mockData = createMockPermission();
      const result = await service.create(mockData, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '创建权限成功',
        data: null,
      });

      expect(mockPermissionRepo.save).toHaveBeenCalledWith({
        name: mockData.name,
        description: mockData.description,
        createdAt: TEST_DATE,
        updatedAt: TEST_DATE,
      });
    });
  });

  describe('update 更新权限', () => {
    it('should return not user when user not found', async () => {
      mockUserService.findByUserId.mockResolvedValue(null);

      const result = await service.update(
        TEST_ID,
        createMockPermission(),
        TEST_USER_ID,
      );

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('should return error when permission not found', async () => {
      mockPermissionRepo.findOne.mockResolvedValue(null);

      const result = await service.update(
        TEST_ID,
        createMockPermission(),
        TEST_USER_ID,
      );

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '指定权限不存在',
        data: undefined,
      });
    });

    it('should return error when update permission failed', async () => {
      mockPermissionRepo.findOne.mockResolvedValue(
        createMockPermission({ id: TEST_ID }),
      );
      mockPermissionRepo.save.mockImplementation(() => {
        throw TEST_ERROR;
      });

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.update(
        TEST_ID,
        createMockPermission(),
        TEST_USER_ID,
      );

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '更新权限失败',
        data: undefined,
      });

      expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);
    });

    it('should update a permission', async () => {
      mockPermissionRepo.findOne.mockResolvedValue(
        createMockPermission({ id: TEST_ID }),
      );

      const mockData = createMockPermission();

      const updateTime = new Date('2025-04-04 12:00:00');
      jest.setSystemTime(updateTime);

      const result = await service.update(TEST_ID, mockData, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '更新权限成功',
        data: null,
      });

      expect(mockPermissionRepo.save).toHaveBeenCalledWith({
        id: TEST_ID,
        name: mockData.name,
        description: mockData.description,
        createdAt: mockData.createdAt,
        updatedAt: updateTime,
        deletedAt: null,
      });
    });
  });

  describe('delete 删除权限', () => {
    it('should return user not found when user is not found', async () => {
      mockUserService.findByUserId.mockResolvedValue(null);

      const result = await service.remove(TEST_ID, TEST_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('should return error when permission is not found', async () => {
      mockPermissionRepo.findOne.mockResolvedValue(null);

      const result = await service.remove(TEST_ID, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '指定权限不存在',
        data: undefined,
      });
    });

    it('should return error when remove permission failed', async () => {
      mockPermissionRepo.save.mockImplementation(() => {
        throw TEST_ERROR;
      });

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.remove(TEST_ID, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '删除权限失败',
        data: undefined,
      });

      expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);
    });

    it('should delete permission', async () => {
      const updateTime = new Date('2025-04-04 12:00:00');
      jest.setSystemTime(updateTime);

      const result = await service.remove(TEST_ID, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '删除权限成功',
        data: null,
      });
      expect(mockPermissionRepo.save).toHaveBeenCalledWith(
        createMockPermission({
          id: TEST_ID,
          deletedAt: new Date(),
          updatedAt: updateTime,
        }),
      );
    });
  });

  describe('findOne 查询权限详情', () => {
    it('should return error when user is not found', async () => {
      mockUserService.findByUserId.mockResolvedValue(null);

      const result = await service.findOne(TEST_ID, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('should return error when find permission is error', async () => {
      mockPermissionRepo.findOne.mockImplementation(() => {
        throw TEST_ERROR;
      });

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.findOne(TEST_ID, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: `查询 ${TEST_ID} 权限失败`,
        data: undefined,
      });

      expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);

      expect(mockPermissionRepo.findOne).toHaveBeenCalledWith({
        where: { id: TEST_ID, deletedAt: IsNull() },
        select: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
      });
    });

    it('should return error when permission is not found', async () => {
      mockPermissionRepo.findOne.mockResolvedValue(null);

      const result = await service.findOne(TEST_ID, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '指定权限不存在',
        data: undefined,
      });
    });

    it('should return permission detail', async () => {
      const mockData = createMockPermission({
        id: TEST_ID,
      });

      mockPermissionRepo.findOne.mockResolvedValue(mockData);

      const result = await service.findOne(TEST_ID, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: `查询 ${TEST_ID} 权限成功`,
        data: mockData,
      });
    });
  });

  describe('findAll 查询权限', () => {
    it('should return error when user is not found', async () => {
      mockUserService.findByUserId.mockResolvedValue(null);

      const result = await service.findAll(
        TEST_PAGE_NO,
        TEST_PAGE_SIZE,
        TEST_USER_ID,
      );

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('should return error when find permission is error', async () => {
      mockPermissionRepo.findAndCount.mockImplementation(() => {
        throw TEST_ERROR;
      });

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.findAll(
        TEST_PAGE_NO,
        TEST_PAGE_SIZE,
        TEST_USER_ID,
      );

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '查询权限失败',
        data: undefined,
      });

      expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);
    });

    it('should return permission list', async () => {
      const mockData = mockPermissionData();

      mockPermissionRepo.findAndCount.mockResolvedValue([
        mockData.list,
        mockData.pageInfo.total,
      ]);

      const result = await service.findAll(
        TEST_PAGE_NO,
        TEST_PAGE_SIZE,
        TEST_USER_ID,
      );

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '查询权限成功',
        data: mockData,
      });

      expect(mockPermissionRepo.findAndCount).toHaveBeenCalledWith({
        where: {
          deletedAt: IsNull(),
        },
        skip: (TEST_PAGE_NO - 1) * TEST_PAGE_SIZE,
        take: TEST_PAGE_SIZE,
        select: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
      });
    });
  });
});
