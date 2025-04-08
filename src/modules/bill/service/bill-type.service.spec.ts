import { Test, TestingModule } from '@nestjs/testing';
import { BillTypeService } from './bill-type.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BillTypeEntity } from '@/modules/bill/entities/bill-type.entity';
import { UserService } from '@/modules/user/user.service';
import { PayTypeEnum } from '@/core/enum/bill.enum';
import { ResultCodeEnum } from '@/core/common/constant';

describe('BillTypeService', () => {
  let service: BillTypeService;
  const TEST_UID = 1;
  const TEST_BILL_TYPE_ID = 1;
  const TEST_PAGE_NO = 1;
  const TEST_PAGE_SIZE = 10;

  const createMockBillType = (overrides = {}) => ({
    id: TEST_BILL_TYPE_ID,
    name: 'test-name',
    payType: PayTypeEnum.PAID,
    ...overrides,
  });

  const createMockUser = (overrides = {}) => ({
    uid: TEST_UID,
    username: 'test-user',
    ...overrides,
  });

  const mockUserService = {
    findByUserId: jest.fn(),
  };

  const mockBillTypeRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-04-01 12:00:00'));

    mockUserService.findByUserId.mockReset();
    mockBillTypeRepo.findOne.mockReset();
    mockBillTypeRepo.save.mockReset();
    mockBillTypeRepo.findAndCount.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillTypeService,
        {
          provide: getRepositoryToken(BillTypeEntity),
          useValue: mockBillTypeRepo,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<BillTypeService>(BillTypeService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('list （分页数据获取）', () => {
    it('should return error when user does not exist', async () => {
      mockUserService.findByUserId.mockResolvedValue(null);

      const result = await service.list(TEST_PAGE_NO, TEST_PAGE_SIZE, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('should return paginated bill type list when user exists', async () => {
      const mockBillTypes = [
        createMockBillType(),
        createMockBillType({ id: 2 }),
      ];
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findAndCount.mockResolvedValue([mockBillTypes, 2]);

      const result = await service.list(TEST_PAGE_NO, TEST_PAGE_SIZE, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '列表数据获取成功',
        data: {
          list: mockBillTypes,
          pageInfo: {
            pageNo: TEST_PAGE_NO,
            total: 2,
            pageSize: TEST_PAGE_SIZE,
          },
        },
      });
    });

    it('should return error when pagination query fails', async () => {
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findAndCount.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.list(TEST_PAGE_NO, TEST_PAGE_SIZE, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '列表数据获取失败',
        data: undefined,
      });
    });
  });

  describe('create （创建账单分类）', () => {
    it('should return error when user does not exist', async () => {
      mockUserService.findByUserId.mockResolvedValue(null);
      const billTypeData = createMockBillType();

      const result = await service.create(billTypeData, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('should return error when bill type already exists', async () => {
      const billTypeData = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findOne.mockResolvedValue(billTypeData);

      const result = await service.create(billTypeData, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单分类已存在',
        data: undefined,
      });
    });

    it('should create new bill type when data is valid', async () => {
      const billTypeData = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findOne.mockResolvedValue(null);
      mockBillTypeRepo.save.mockResolvedValue(billTypeData);

      const result = await service.create(billTypeData, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '账单分类创建成功',
        data: null,
      });
      expect(mockBillTypeRepo.save).toHaveBeenCalledWith({
        name: billTypeData.name,
        payType: billTypeData.payType,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { uid: TEST_UID, username: 'test-user' },
      });
    });

    it('should return error when creation fails', async () => {
      const billTypeData = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findOne.mockResolvedValue(null);
      mockBillTypeRepo.save.mockRejectedValue(new Error('Creation failed'));

      const result = await service.create(billTypeData, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '账单分类创建失败',
        data: undefined,
      });
    });
  });

  describe('update （更新账单分类）', () => {
    it('should return error when user does not exist', async () => {
      mockUserService.findByUserId.mockResolvedValue(null);
      const billTypeData = createMockBillType();

      const result = await service.update(billTypeData, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('should return error when bill type does not exist', async () => {
      const billTypeData = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findOne.mockResolvedValue(null);

      const result = await service.update(billTypeData, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单分类不存在',
        data: undefined,
      });
    });

    it('should return error when bill type is deleted', async () => {
      const billTypeData = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...billTypeData,
        deletedAt: new Date(),
      });

      const result = await service.update(billTypeData, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单分类不存在',
        data: undefined,
      });
    });

    it('should return error when user has no permission', async () => {
      const billTypeData = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...billTypeData,
        user: { uid: TEST_UID + 1 }, // Different user
      });

      const result = await service.update(billTypeData, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '暂无修改权限',
        data: undefined,
      });
    });

    it('should update bill type when data is valid', async () => {
      const billTypeData = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...billTypeData,
        user: { uid: TEST_UID },
      });
      mockBillTypeRepo.save.mockResolvedValue(billTypeData);

      const result = await service.update(billTypeData, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '账单分类修改成功',
        data: null,
      });
      expect(mockBillTypeRepo.save).toHaveBeenCalledWith({
        id: billTypeData.id,
        name: billTypeData.name,
        payType: billTypeData.payType,
        updatedAt: new Date(),
        user: { uid: TEST_UID },
      });
    });

    it('should return error when update fails', async () => {
      const billTypeData = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...billTypeData,
        user: { uid: TEST_UID },
      });
      mockBillTypeRepo.save.mockRejectedValue(new Error('Update failed'));

      const result = await service.update(billTypeData, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '账单分类修改失败',
        data: undefined,
      });
    });
  });

  describe('delete （软删除账单分类）', () => {
    it('should return error when user does not exist', async () => {
      mockUserService.findByUserId.mockResolvedValue(null);

      const result = await service.delete(TEST_BILL_TYPE_ID, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('should return error when bill type does not exist', async () => {
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findOne.mockResolvedValue(null);

      const result = await service.delete(TEST_BILL_TYPE_ID, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单分类不存在',
        data: undefined,
      });
    });

    it('should return error when bill type is already deleted', async () => {
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...createMockBillType(),
        deletedAt: new Date(),
      });

      const result = await service.delete(TEST_BILL_TYPE_ID, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单分类不存在',
        data: undefined,
      });
    });

    it('should return error when user has no permission', async () => {
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...createMockBillType(),
        user: { uid: TEST_UID + 1 }, // Different user
      });

      const result = await service.delete(TEST_BILL_TYPE_ID, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '暂无删除权限',
        data: undefined,
      });
    });

    it('should soft delete bill type when user has permission', async () => {
      const mockBillType = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...mockBillType,
        user: { uid: TEST_UID },
      });
      mockBillTypeRepo.save.mockResolvedValue({
        ...mockBillType,
        deletedAt: new Date(),
      });

      const result = await service.delete(TEST_BILL_TYPE_ID, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '账单分类删除成功',
        data: null,
      });
      expect(mockBillTypeRepo.save).toHaveBeenCalledWith({
        id: mockBillType.id,
        name: mockBillType.name,
        payType: mockBillType.payType,
        deletedAt: new Date(),
        user: { uid: TEST_UID },
      });
    });

    it('should return error when deletion fails', async () => {
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...createMockBillType(),
        user: { uid: TEST_UID },
      });
      mockBillTypeRepo.save.mockRejectedValue(new Error('Deletion failed'));

      const result = await service.delete(TEST_BILL_TYPE_ID, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '账单分类删除失败',
        data: undefined,
      });
    });
  });

  describe('recover （管理员恢复账单分类）', () => {
    it('should return error when user does not exist', async () => {
      mockUserService.findByUserId.mockResolvedValue(null);

      const result = await service.recover(TEST_BILL_TYPE_ID, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('should return error when user is not admin', async () => {
      mockUserService.findByUserId.mockResolvedValue(
        createMockUser({ isAdmin: '0' }),
      );

      const result = await service.recover(TEST_BILL_TYPE_ID, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户暂无恢复权限',
        data: undefined,
      });
    });

    it('should return error when bill type does not exist', async () => {
      mockUserService.findByUserId.mockResolvedValue(
        createMockUser({ isAdmin: '1' }),
      );
      mockBillTypeRepo.findOne.mockResolvedValue(null);

      const result = await service.recover(TEST_BILL_TYPE_ID, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单分类不存在',
        data: undefined,
      });
    });

    it('should skip recovery when bill type is not deleted', async () => {
      const mockBillType = createMockBillType({ deletedAt: null });
      mockUserService.findByUserId.mockResolvedValue(
        createMockUser({ isAdmin: '1' }),
      );
      mockBillTypeRepo.findOne.mockResolvedValue(mockBillType);

      const result = await service.recover(TEST_BILL_TYPE_ID, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '账单分类恢复成功',
        data: null,
      });
      expect(mockBillTypeRepo.save).not.toHaveBeenCalled();
    });

    it('should recover deleted bill type when user is admin', async () => {
      const mockBillType = createMockBillType({ deletedAt: new Date() });
      mockUserService.findByUserId.mockResolvedValue(
        createMockUser({ isAdmin: '1' }),
      );
      mockBillTypeRepo.findOne.mockResolvedValue(mockBillType);
      mockBillTypeRepo.save.mockResolvedValue({
        ...mockBillType,
        deletedAt: null,
      });

      const result = await service.recover(TEST_BILL_TYPE_ID, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '账单分类恢复成功',
        data: null,
      });
      expect(mockBillTypeRepo.save).toHaveBeenCalledWith({
        id: mockBillType.id,
        name: mockBillType.name,
        payType: mockBillType.payType,
        deletedAt: null,
      });
    });

    it('should return error when recovery fails', async () => {
      mockUserService.findByUserId.mockResolvedValue(
        createMockUser({ isAdmin: '1' }),
      );
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...createMockBillType(),
        deletedAt: new Date(),
      });
      mockBillTypeRepo.save.mockRejectedValue(new Error('Recovery failed'));

      const result = await service.recover(TEST_BILL_TYPE_ID, TEST_UID);

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '账单分类恢复失败',
        data: undefined,
      });
    });
  });
});
