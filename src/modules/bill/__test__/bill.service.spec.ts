import { Test, TestingModule } from '@nestjs/testing';
import { BillService } from '@/modules/bill/service/bill.service';
import { UserService } from '@/modules/user/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BillTypeEntity } from '@/modules/bill/entities/bill-type.entity';
import { BillEntity } from '@/modules/bill/entities/bill.entity';
import { PayTypeEnum } from '@/core/enum/bill.enum';
import { ResultCodeEnum } from '@/core/common/constant';
import {
  TEST_PAGE_SIZE,
  TEST_PAGE_NO,
  TEST_USER_ID,
  TEST_USER_NAME,
  TEST_ERROR,
  TEST_DATE,
} from '@/test/test.constant';
import { mockUserService, validateUser } from '@/test/help/validate-user.test';

describe('BillService', () => {
  let service: BillService;
  const TEST_BILL_ID = 1;
  const TEST_BILL_TYPE_ID = 1;
  const TEST_AMOUNT = 10000; // ¥10.00

  // Mock data generators
  const createMockUser = (overrides = {}) => ({
    uid: TEST_USER_ID,
    username: TEST_USER_NAME,
    ...overrides,
  });

  const createMockBillType = (overrides = {}) => ({
    id: TEST_BILL_TYPE_ID,
    name: 'test-bill-type',
    payType: PayTypeEnum.PAID,
    ...overrides,
  });

  const createMockBill = (overrides = {}) => ({
    id: TEST_BILL_ID,
    payType: PayTypeEnum.PAID,
    amount: TEST_AMOUNT,
    date: TEST_DATE,
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    user: createMockUser(),
    type: createMockBillType(),
    ...overrides,
  });

  const createBillDto = (overrides = {}) => ({
    payType: PayTypeEnum.PAID,
    amount: TEST_AMOUNT,
    date: TEST_DATE,
    typeId: TEST_BILL_TYPE_ID,
    ...overrides,
  });

  const createUpdateBillDto = (overrides = {}) => ({
    id: TEST_BILL_ID,
    ...createBillDto(),
    ...overrides,
  });

  const createListQuery = (overrides = {}) => ({
    pageInfo: {
      pageSize: TEST_PAGE_SIZE,
      pageNo: TEST_PAGE_NO,
    },
    queryData: {
      date: TEST_DATE,
    },
    ...overrides,
  });

  const mockBillTypeRepo = {
    findOne: jest.fn(),
  };

  const mockBillRepo = {
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(TEST_DATE);

    // Reset all mocks
    mockUserService.findByUserId.mockReset();
    mockBillTypeRepo.findOne.mockReset();
    mockBillRepo.save.mockReset();
    mockBillRepo.findOne.mockReset();
    mockBillRepo.findAndCount.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: getRepositoryToken(BillTypeEntity),
          useValue: mockBillTypeRepo,
        },
        {
          provide: getRepositoryToken(BillEntity),
          useValue: mockBillRepo,
        },
      ],
    }).compile();

    service = module.get<BillService>(BillService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    beforeEach(() => {
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findOne.mockResolvedValue(createMockBillType());
      mockBillRepo.save.mockResolvedValue(createMockBill());
    });

    it('should return error when user does not exist', async () => {
      mockUserService.findByUserId.mockResolvedValue(null);

      const result = await service.create(createBillDto(), TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('should return error when bill type does not exist', async () => {
      mockBillTypeRepo.findOne.mockResolvedValue(null);

      const result = await service.create(createBillDto(), TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单分类不存在',
        data: undefined,
      });
      expect(mockBillTypeRepo.findOne).toHaveBeenCalledWith({
        where: { id: TEST_BILL_TYPE_ID },
      });
    });

    it('should return error when creation fails', async () => {
      mockBillRepo.save.mockRejectedValue(TEST_ERROR);

      const result = await service.create(createBillDto(), TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '账单创建失败',
        data: undefined,
      });
    });

    it('should create bill successfully when data is valid', async () => {
      const result = await service.create(createBillDto(), TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '账单创建成功',
        data: null,
      });
      expect(mockBillRepo.save).toHaveBeenCalledWith({
        payType: PayTypeEnum.PAID,
        amount: TEST_AMOUNT,
        date: TEST_DATE,
        createdAt: TEST_DATE,
        updatedAt: TEST_DATE,
        type: {
          id: TEST_BILL_TYPE_ID,
          name: 'test-bill-type',
          payType: PayTypeEnum.PAID,
        },
        user: {
          uid: TEST_USER_ID,
          username: TEST_USER_NAME,
        },
      });
    });
  });

  describe('update', () => {
    beforeEach(() => {
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillTypeRepo.findOne.mockResolvedValue(createMockBillType());
      mockBillRepo.findOne.mockResolvedValue(createMockBill());
      mockBillRepo.save.mockResolvedValue(createMockBill());
    });

    it('should return error when user does not exist', async () => {
      await validateUser(async () => {
        return await service.update(createUpdateBillDto(), TEST_USER_ID);
      });
    });

    it('should return error when bill type does not exist', async () => {
      mockBillTypeRepo.findOne.mockResolvedValue(null);

      const result = await service.update(createUpdateBillDto(), TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单分类不存在',
        data: undefined,
      });
    });

    it('should return error when bill does not exist', async () => {
      mockBillRepo.findOne.mockResolvedValue(null);

      const result = await service.update(createUpdateBillDto(), TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单不存在或已被删除',
        data: undefined,
      });
    });

    it('should return error when bill is deleted', async () => {
      mockBillRepo.findOne.mockResolvedValue(
        createMockBill({ deletedAt: TEST_DATE }),
      );

      const result = await service.update(createUpdateBillDto(), TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单不存在或已被删除',
        data: undefined,
      });
    });

    it('should return error when user has no permission', async () => {
      mockBillRepo.findOne.mockResolvedValue(
        createMockBill({ user: { uid: 999 } }),
      );

      const result = await service.update(createUpdateBillDto(), TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '暂无修改权限',
        data: undefined,
      });
    });

    it('should return error when update fails', async () => {
      mockBillRepo.save.mockRejectedValue(TEST_ERROR);

      const result = await service.update(createUpdateBillDto(), TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '账单修改失败',
        data: undefined,
      });
    });

    it('should update bill successfully when data is valid', async () => {
      const result = await service.update(createUpdateBillDto(), TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '账单修改成功',
        data: null,
      });
      expect(mockBillRepo.save).toHaveBeenCalledWith({
        id: TEST_BILL_ID,
        payType: PayTypeEnum.PAID,
        amount: TEST_AMOUNT,
        date: TEST_DATE,
        createdAt: TEST_DATE,
        updatedAt: TEST_DATE,
        type: {
          id: TEST_BILL_TYPE_ID,
          name: 'test-bill-type',
          payType: PayTypeEnum.PAID,
        },
        user: {
          uid: TEST_USER_ID,
          username: TEST_USER_NAME,
        },
      });
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillRepo.findOne.mockResolvedValue(createMockBill());
      mockBillRepo.save.mockResolvedValue(createMockBill());
    });

    it('should return error when user does not exist', async () => {
      await validateUser(async () => {
        return await service.delete(TEST_BILL_ID, TEST_USER_ID);
      });
    });

    it('should return error when bill does not exist', async () => {
      mockBillRepo.findOne.mockResolvedValue(null);

      const result = await service.delete(TEST_BILL_ID, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单不存在',
        data: undefined,
      });
    });

    it('should return error when deletion fails', async () => {
      mockBillRepo.save.mockRejectedValue(TEST_ERROR);

      const result = await service.delete(TEST_BILL_ID, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '账单删除失败',
        data: undefined,
      });
    });

    it('should delete bill successfully when user has permission', async () => {
      const result = await service.delete(TEST_BILL_ID, TEST_USER_ID);

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '账单删除成功',
        data: null,
      });
      expect(mockBillRepo.save).toHaveBeenCalledWith({
        ...createMockBill(),
        deletedAt: TEST_DATE,
      });
    });
  });

  describe('list', () => {
    const mockBillList = [createMockBill(), createMockBill({ id: 2 })];

    beforeEach(() => {
      mockUserService.findByUserId.mockResolvedValue(createMockUser());
      mockBillRepo.findAndCount.mockResolvedValue([
        mockBillList,
        mockBillList.length,
      ]);
    });

    it('should return error when user does not exist', async () => {
      mockUserService.findByUserId.mockResolvedValue(null);

      const result = await service.list(
        createListQuery().pageInfo,
        createListQuery().queryData,
        TEST_USER_ID,
      );

      expect(result).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('should return paginated bill list when user exists', async () => {
      const result = await service.list(
        createListQuery().pageInfo,
        createListQuery().queryData,
        TEST_USER_ID,
      );

      expect(result).toEqual({
        code: ResultCodeEnum.success,
        message: '账单查询成功',
        data: {
          list: mockBillList,
          pageInfo: {
            pageNo: TEST_PAGE_NO,
            total: mockBillList.length,
            pageSize: TEST_PAGE_SIZE,
          },
        },
      });
    });

    it('should return error when query fails', async () => {
      mockBillRepo.findAndCount.mockRejectedValue(TEST_ERROR);

      const result = await service.list(
        createListQuery().pageInfo,
        createListQuery().queryData,
        TEST_USER_ID,
      );

      expect(result).toEqual({
        code: ResultCodeEnum.error,
        message: '账单查询失败',
        data: undefined,
      });
    });
  });
});
