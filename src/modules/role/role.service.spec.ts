import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { UserService } from '@/modules/user/user.service';
import { Logger } from '@nestjs/common';
import { RoleEntity } from '@/modules/role/entities/role.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PermissionEntity } from '@/modules/permission/entities/permission.entity';
import { ResultData } from '@/core/utils/result';
import { ResultCodeEnum } from '@/core/common/constant';
import { In, IsNull } from 'typeorm';
import { TEST_PAGE_NO, TEST_PAGE_SIZE, TEST_TOTAL } from '@/test/test.constant';

describe('RoleService', () => {
  let service: RoleService;

  const TEST_DATE = new Date('2025-01-01T00:00:00.000Z');
  const TEST_USER_ID = 5;

  const TEST_ROLE_ID = 1;
  const TEST_ROLE_NAME = 'test-role';
  const TEST_ROLE_DESCRIPTION = 'test-description';
  const TEST_PERMISSIONS = [
    {
      id: 1,
      name: 'system:test:create',
      description: 'test-description',
    },
  ];

  const TEST_ERROR = new Error('role-service-test-error');

  const createMockDto = (options = {}) => {
    return {
      name: TEST_ROLE_NAME,
      description: TEST_ROLE_DESCRIPTION,
      permissions: TEST_PERMISSIONS.map((item) => item.name),
      ...options,
    };
  };

  const createMockRoleRes = (options = {}) =>
    createMockDto({
      id: TEST_ROLE_ID,
      createdAt: TEST_DATE,
      updatedAt: TEST_DATE,
      permissions: TEST_PERMISSIONS,
      deletedAt: null,
      ...options,
    });

  const mockRoleData = () => ({
    list: [
      createMockRoleRes({ id: 1 }),
      createMockRoleRes({ id: 2 }),
      createMockRoleRes({ id: 3 }),
      createMockRoleRes({ id: 4 }),
      createMockRoleRes({ id: 5 }),
    ],
    pageInfo: {
      pageNo: TEST_PAGE_NO,
      pageSize: TEST_PAGE_SIZE,
      total: TEST_TOTAL,
    },
  });

  const mockUserService = {
    validateUser: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
  };

  const mockRoleRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockPermissionRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(TEST_DATE);

    mockLogger.error.mockReset();
    mockUserService.validateUser.mockReset().mockResolvedValue(null);

    mockRoleRepo.save.mockReset();
    mockRoleRepo.findOne.mockReset();
    mockRoleRepo.findAndCount.mockReset();

    mockPermissionRepo.find.mockReset().mockResolvedValue(TEST_PERMISSIONS);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: mockRoleRepo,
        },
        {
          provide: getRepositoryToken(PermissionEntity),
          useValue: mockPermissionRepo,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const validateUser = async <T>(callback: () => Promise<T>) => {
    mockUserService.validateUser.mockResolvedValue(
      ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前用户不存在',
      ),
    );

    const result = await callback();

    expect(result).toEqual({
      code: ResultCodeEnum.exception_error,
      message: '当前用户不存在',
      data: undefined,
    });

    expect(mockUserService.validateUser).toHaveBeenCalledWith(TEST_USER_ID);
  };

  describe('create 创建角色', () => {
    beforeEach(() => {
      mockRoleRepo.findOne.mockResolvedValue(null);
    });

    it('should return not user when user not found', () => {
      validateUser(async () => {
        return service.create(createMockDto(), TEST_USER_ID);
      });
    });

    it('should return error when role already exists', async () => {
      mockRoleRepo.findOne.mockResolvedValue(createMockRoleRes());

      const mockDto = createMockDto();

      const result = await service.create(mockDto, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前角色已存在',
        data: undefined,
      });

      expect(mockRoleRepo.findOne).toHaveBeenCalledWith({
        where: {
          name: mockDto.name,
        },
      });
    });

    it('should create a new role and not permission when permission not found', async () => {
      mockPermissionRepo.find.mockImplementation(() => {
        throw TEST_ERROR;
      });

      const loggerSpy = jest.spyOn(service['logger'], 'error');
      const mockDto = createMockDto();

      const result = await service.create(mockDto, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '创建角色成功',
        data: null,
      });

      expect(mockPermissionRepo.find).toHaveBeenCalledWith({
        where: { name: In(mockDto.permissions) },
      });

      expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);

      expect(mockRoleRepo.save).toHaveBeenCalledWith({
        name: mockDto.name,
        description: mockDto.description,
        createdAt: TEST_DATE,
        updatedAt: TEST_DATE,
        permissions: [],
      });
    });

    it('should not error when permission is not exists', async () => {
      const mockDto = createMockDto({
        permissions: undefined,
      });

      const result = await service.create(mockDto, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '创建角色成功',
        data: null,
      });

      expect(mockPermissionRepo.find).not.toHaveBeenCalled();

      expect(mockRoleRepo.save).toHaveBeenCalledWith({
        name: mockDto.name,
        description: mockDto.description,
        createdAt: TEST_DATE,
        updatedAt: TEST_DATE,
      });
    });

    it('should create a new role and permission when permission found', async () => {
      mockPermissionRepo.find.mockResolvedValue(TEST_PERMISSIONS);

      const mockDto = createMockDto();

      const result = await service.create(mockDto, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '创建角色成功',
        data: null,
      });

      expect(mockPermissionRepo.find).toHaveBeenCalledWith({
        where: { name: In(mockDto.permissions) },
      });

      expect(mockRoleRepo.save).toHaveBeenCalledWith({
        name: mockDto.name,
        description: mockDto.description,
        createdAt: TEST_DATE,
        updatedAt: TEST_DATE,
        permissions: TEST_PERMISSIONS,
      });
    });

    it('should return error when create role failed', async () => {
      mockRoleRepo.save.mockImplementation(() => {
        throw TEST_ERROR;
      });

      const loggerSpy = jest.spyOn(service['logger'], 'error');
      const mockDto = createMockDto();
      const result = await service.create(mockDto, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '创建角色失败',
        data: undefined,
      });

      expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);
    });
  });

  describe('update 更新角色', () => {
    beforeEach(() => {
      mockRoleRepo.findOne.mockResolvedValue(createMockRoleRes());
    });

    it('should return not user when user not found', () => {
      validateUser(async () => {
        return service.update(TEST_ROLE_ID, createMockDto(), TEST_USER_ID);
      });
    });

    it('should return error when role not found', async () => {
      mockRoleRepo.findOne.mockResolvedValue(null);

      const mockDto = createMockDto();

      const result = await service.update(TEST_ROLE_ID, mockDto, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前角色不存在',
        data: undefined,
      });
    });

    it('should update a role and not permission when permission not found', async () => {
      mockPermissionRepo.find.mockImplementation(() => {
        throw TEST_ERROR;
      });

      const loggerSpy = jest.spyOn(service['logger'], 'error');
      const mockDto = createMockDto();

      const result = await service.update(TEST_ROLE_ID, mockDto, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '更新角色成功',
        data: null,
      });

      expect(mockPermissionRepo.find).toHaveBeenCalledWith({
        where: { name: In(mockDto.permissions) },
      });

      expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);

      expect(mockRoleRepo.save).toHaveBeenCalledWith({
        id: TEST_ROLE_ID,
        name: mockDto.name,
        description: mockDto.description,
        createdAt: TEST_DATE,
        updatedAt: TEST_DATE,
        permissions: [],
        deletedAt: null,
      });
    });

    it('should update a role when permission is not string arr', async () => {
      const mockDto = createMockDto({
        permissions: undefined,
      });

      await service.update(TEST_ROLE_ID, mockDto, TEST_USER_ID);

      expect(mockPermissionRepo.find).not.toHaveBeenCalled();

      expect(mockRoleRepo.save).toHaveBeenCalledWith({
        id: TEST_ROLE_ID,
        name: mockDto.name,
        description: mockDto.description,
        createdAt: TEST_DATE,
        updatedAt: TEST_DATE,
        permissions: TEST_PERMISSIONS,
        deletedAt: null,
      });
    });

    it('should update a role and permission when permission found', async () => {
      mockPermissionRepo.find.mockResolvedValue(TEST_PERMISSIONS);

      const mockDto = createMockDto();

      const result = await service.update(TEST_ROLE_ID, mockDto, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '更新角色成功',
        data: null,
      });

      expect(mockPermissionRepo.find).toHaveBeenCalledWith({
        where: { name: In(mockDto.permissions) },
      });

      expect(mockRoleRepo.save).toHaveBeenCalledWith({
        id: TEST_ROLE_ID,
        name: mockDto.name,
        description: mockDto.description,
        createdAt: TEST_DATE,
        updatedAt: TEST_DATE,
        permissions: TEST_PERMISSIONS,
        deletedAt: null,
      });
    });

    it('should return error when update role failed', async () => {
      mockRoleRepo.save.mockImplementation(() => {
        throw TEST_ERROR;
      });

      const loggerSpy = jest.spyOn(service['logger'], 'error');
      const mockDto = createMockDto();
      const result = await service.update(TEST_ROLE_ID, mockDto, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '更新角色失败',
        data: undefined,
      });

      expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);
    });
  });

  describe('remove 删除角色', () => {
    beforeEach(() => {
      mockRoleRepo.findOne.mockResolvedValue(createMockRoleRes());
    });

    it('should return not user when user not found', () => {
      validateUser(async () => {
        return service.remove(TEST_ROLE_ID, TEST_USER_ID);
      });
    });

    it('should return error when role not found', async () => {
      mockRoleRepo.findOne.mockResolvedValue(null);

      const result = await service.remove(TEST_ROLE_ID, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前角色不存在',
        data: undefined,
      });
    });

    it('should delete a role and permission when permission found', async () => {
      mockPermissionRepo.find.mockResolvedValue(TEST_PERMISSIONS);

      const result = await service.remove(TEST_ROLE_ID, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '删除角色成功',
        data: null,
      });

      expect(mockRoleRepo.save).toHaveBeenCalledWith({
        id: TEST_ROLE_ID,
        name: TEST_ROLE_NAME,
        description: TEST_ROLE_DESCRIPTION,
        createdAt: TEST_DATE,
        updatedAt: TEST_DATE,
        permissions: TEST_PERMISSIONS,
        deletedAt: TEST_DATE,
      });
    });

    it('should return error when delete role failed', async () => {
      mockRoleRepo.save.mockImplementation(() => {
        throw TEST_ERROR;
      });

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.remove(TEST_ROLE_ID, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '删除角色失败',
        data: undefined,
      });

      expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);
    });
  });

  describe('findAll 查询角色分页', () => {
    beforeEach(() => {
      mockRoleRepo.findOne.mockResolvedValue(createMockRoleRes());
    });

    it('should return not user when user not found', () => {
      validateUser(async () => {
        return service.findAll(TEST_PAGE_NO, TEST_PAGE_SIZE, TEST_USER_ID);
      });
    });

    it('should return error when find role is error', async () => {
      mockRoleRepo.findAndCount.mockImplementation(() => {
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
        message: '查询角色失败',
        data: undefined,
      });

      expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);
    });

    it('should return role list', async () => {
      const mockData = mockRoleData();

      mockRoleRepo.findAndCount.mockResolvedValue([
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
        message: '查询角色成功',
        data: mockData,
      });

      expect(mockRoleRepo.findAndCount).toHaveBeenCalledWith({
        where: {
          deletedAt: IsNull(),
        },
        skip: (TEST_PAGE_NO - 1) * TEST_PAGE_SIZE,
        take: TEST_PAGE_SIZE,
        select: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
      });
    });
  });

  describe('findOne 查询角色详情', () => {
    beforeEach(() => {
      mockRoleRepo.findOne.mockResolvedValue(createMockRoleRes());
    });

    it('should return not user when user not found', () => {
      validateUser(async () => {
        return service.findOne(TEST_ROLE_ID, TEST_USER_ID);
      });
    });

    it('should return error when find role is not found', async () => {
      mockRoleRepo.findOne.mockResolvedValue(null);

      const result = await service.findOne(TEST_ROLE_ID, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前角色不存在',
        data: undefined,
      });
    });

    it('should return error when find role is error', async () => {
      mockRoleRepo.findOne.mockImplementation(() => {
        throw TEST_ERROR;
      });

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.findOne(TEST_ROLE_ID, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '查询角色失败',
        data: undefined,
      });

      expect(loggerSpy).toHaveBeenCalledWith(TEST_ERROR);
    });

    it('should return role detail', async () => {
      const mockData = createMockRoleRes();

      mockRoleRepo.findOne.mockResolvedValue(mockData);

      const result = await service.findOne(TEST_ROLE_ID, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: `查询角色成功`,
        data: mockData,
      });
    });
  });
});
