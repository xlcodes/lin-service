import { Test, TestingModule } from '@nestjs/testing';
import { BillService } from './bill.service';
import { UserService } from '@/modules/user/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BillTypeEntity } from '@/modules/bill/entities/bill-type.entity';
import { BillEntity } from '@/modules/bill/entities/bill.entity';
import { PayTypeEnum } from '@/core/enum/bill.enum';
import { ResultCodeEnum } from '@/core/common/constant';

const createMockBill = () => {
  return {
    id: 1,
    payType: PayTypeEnum.PAID,
    amount: 10000, // ¥10.00
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      uid: 1,
    },
    type: {
      id: 1,
    },
  } as BillEntity;
};

describe('BillService', () => {
  let service: BillService;

  const testUid = 1;

  const mockData = {
    userService: {
      findByUserId: jest.fn().mockResolvedValue({
        uid: testUid,
      }),
    },
    billTypeRepo: {
      findOne: jest.fn(),
    },
    billRepo: {
      save: jest.fn().mockResolvedValue({}),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillService,
        {
          provide: UserService,
          useValue: mockData.userService,
        },
        {
          provide: getRepositoryToken(BillTypeEntity),
          useValue: mockData.billTypeRepo,
        },
        {
          provide: getRepositoryToken(BillEntity),
          useValue: mockData.billRepo,
        },
      ],
    }).compile();

    service = module.get<BillService>(BillService);
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-04-01 12:00:00'));
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('【create】创建账单', () => {
    const mockBill = createMockBill();

    beforeEach(() => {
      mockData.userService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockData.billTypeRepo.findOne.mockResolvedValue({
        id: 1,
      });
    });

    const createdBillDto = () => {
      return {
        payType: mockBill.payType,
        amount: mockBill.amount,
        date: mockBill.date,
        typeId: mockBill.type.id,
      };
    };

    it('当前用户不存在', async () => {
      mockData.userService.findByUserId.mockResolvedValue(null);

      const res = await service.create(createdBillDto(), testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('当前账单分类不存在', async () => {
      mockData.billTypeRepo.findOne.mockResolvedValue(null);

      const res = await service.create(createdBillDto(), testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单分类不存在',
        data: undefined,
      });
      expect(mockData.billTypeRepo.findOne).toHaveBeenCalledTimes(1);
    });

    it('新建账单异常', async () => {
      mockData.billRepo.save.mockImplementation(() => {
        throw new Error('新建账单异常');
      });

      const res = await service.create(createdBillDto(), testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.error,
        message: '账单创建失败',
        data: undefined,
      });
    });

    it('新建账单成功', async () => {
      const res = await service.create(createdBillDto(), testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.success,
        message: '账单创建成功',
        data: null,
      });
    });
  });

  describe('【update】修改账单', () => {
    const updatedBillDto = () => {
      return {
        id: 1,
        payType: PayTypeEnum.PAID,
        amount: 10000,
        date: new Date(),
        typeId: 1,
      };
    };

    beforeEach(() => {
      mockData.userService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockData.billTypeRepo.findOne.mockResolvedValue({
        id: 1,
      });
      mockData.billRepo.findOne.mockResolvedValue({
        id: 1,
        payType: PayTypeEnum.PAID,
        amount: 10000, // ¥10.00
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          uid: 1,
        },
        type: {
          id: 1,
        },
      });
    });

    it('当前用户不存在', async () => {
      mockData.userService.findByUserId.mockResolvedValue(null);

      const res = await service.update(updatedBillDto(), testUid);
      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('修改的账单分类不存在', async () => {
      mockData.billTypeRepo.findOne.mockResolvedValue(null);

      const res = await service.update(updatedBillDto(), testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单分类不存在',
        data: undefined,
      });

      expect(mockData.billTypeRepo.findOne).toHaveBeenCalledTimes(1);
    });
    it('被修改的账单不存在', async () => {
      mockData.billRepo.findOne.mockResolvedValue(null);

      const res = await service.update(updatedBillDto(), testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单不存在或已被删除',
        data: undefined,
      });
      expect(mockData.billRepo.findOne).toHaveBeenCalledTimes(1);
    });
    it('被修改的账单已经被删除', async () => {
      mockData.billRepo.findOne.mockResolvedValue({
        id: 1,
        deletedAt: new Date(),
        user: {
          uid: 1,
        },
      });

      const res = await service.update(updatedBillDto(), testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单不存在或已被删除',
        data: undefined,
      });
      expect(mockData.billRepo.findOne).toHaveBeenCalledTimes(1);
    });
    it('当前用户无修改权限', async () => {
      mockData.billRepo.findOne.mockResolvedValue({
        id: 1,
        user: {
          uid: 100,
        },
      });

      const res = await service.update(updatedBillDto(), testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '暂无修改权限',
        data: undefined,
      });
      expect(mockData.billRepo.findOne).toHaveBeenCalledTimes(1);
    });
    it('账单修改异常', async () => {
      mockData.billRepo.save.mockImplementation(() => {
        throw new Error('修改账单异常');
      });

      const res = await service.update(updatedBillDto(), testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.error,
        message: '账单修改失败',
        data: undefined,
      });

      expect(mockData.billRepo.save).toHaveBeenCalledTimes(1);
    });
    it('账单修改成功', async () => {
      const res = await service.update(updatedBillDto(), testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.success,
        message: '账单修改成功',
        data: null,
      });

      expect(mockData.billRepo.save).toHaveBeenCalledWith({
        id: 1,
        payType: PayTypeEnum.PAID,
        amount: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
        date: new Date(),
        type: {
          id: 1,
        },
        user: {
          uid: 1,
        },
      });
    });
  });

  describe('【delete】删除账单', () => {
    const mockBillId = 1;
    beforeEach(() => {
      mockData.userService.findByUserId.mockResolvedValue({
        uid: testUid,
      });

      mockData.billRepo.findOne.mockResolvedValue({
        id: 1,
        payType: PayTypeEnum.PAID,
        amount: 10000, // ¥10.00
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          uid: 1,
        },
        type: {
          id: 1,
        },
      });
    });

    it('当前用户不存在', async () => {
      mockData.userService.findByUserId.mockResolvedValue(null);

      const res = await service.delete(mockBillId, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('当前账单不存在', async () => {
      mockData.billRepo.findOne.mockResolvedValue(null);

      const res = await service.delete(mockBillId, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单不存在',
        data: undefined,
      });
    });

    it('账单删除失败', async () => {
      mockData.billRepo.save.mockImplementation(() => {
        throw new Error('账单删除异常');
      });

      const res = await service.delete(mockBillId, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.error,
        message: '账单删除失败',
        data: undefined,
      });
    });

    it('账单删除成功', async () => {
      const res = await service.delete(mockBillId, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.success,
        message: '账单删除成功',
        data: null,
      });
    });
  });

  describe('【list】账单分页查询', () => {
    const mockListQuery = {
      pageInfo: {
        pageSize: 10,
        pageNo: 1,
      },
      queryData: {
        date: new Date(),
      },
    };

    beforeEach(() => {
      mockData.userService.findByUserId.mockResolvedValue({
        uid: testUid,
      });

      mockData.billRepo.findAndCount.mockResolvedValue([[], 10]);
    });

    it('当前用户不存在', async () => {
      mockData.userService.findByUserId.mockResolvedValue(null);

      const res = await service.list(
        mockListQuery.pageInfo,
        mockListQuery.queryData,
        testUid,
      );

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('账单查询成功', async () => {
      const res = await service.list(
        mockListQuery.pageInfo,
        mockListQuery.queryData,
        testUid,
      );

      expect(res).toEqual({
        code: ResultCodeEnum.success,
        message: '账单查询成功',
        data: {
          list: [],
          pageInfo: {
            pageNo: mockListQuery.pageInfo.pageNo,
            total: 10,
            pageSize: mockListQuery.pageInfo.pageSize,
          },
        },
      });
    });

    it('账单查询失败', async () => {
      mockData.billRepo.findAndCount.mockImplementation(() => {
        throw new Error('账单查询异常');
      });

      const res = await service.list(
        mockListQuery.pageInfo,
        mockListQuery.queryData,
        testUid,
      );

      expect(res).toEqual({
        code: ResultCodeEnum.error,
        message: '账单查询失败',
        data: undefined,
      });
    });
  });
});
