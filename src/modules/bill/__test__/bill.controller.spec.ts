import { Test, TestingModule } from '@nestjs/testing';
import { BillController } from '@/modules/bill/controller/bill.controller';
import { BillService } from '@/modules/bill/service/bill.service';
import { ResultCodeEnum } from '@/core/common/constant';
import { PayTypeEnum } from '@/core/enum/bill.enum';
import { TEST_USER_ID } from '@/test/test.constant';

describe('BillController', () => {
  let controller: BillController;
  const mockBillService = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    list: jest.fn(),
  };

  const TEST_BILL_ID = 1;
  const TEST_BILL_TYPE_ID = 1;
  const mockDate = new Date();

  const mockBillData = {
    id: TEST_BILL_ID,
    payType: PayTypeEnum.PAID,
    amount: 1200,
    data: mockDate,
    type: {
      id: TEST_BILL_TYPE_ID,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillController],
      providers: [
        {
          provide: BillService,
          useValue: mockBillService,
        },
      ],
    }).compile();

    controller = module.get<BillController>(BillController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('分页数据获取', async () => {
    const mockBillList = [
      {
        id: mockBillData.id,
        type: {
          id: TEST_BILL_TYPE_ID,
        },
        payType: mockBillData.payType,
        amount: mockBillData.amount,
        data: mockBillData.data,
      },
    ];

    const mockPageInfo = {
      pageNo: 1,
      pageSize: 10,
      total: 10,
    };

    mockBillService.list.mockResolvedValue({
      code: ResultCodeEnum.success,
      message: '账单查询成功',
      data: {
        list: mockBillList,
        pageInfo: mockPageInfo,
      },
    });

    const res = await controller.getList(
      mockPageInfo.pageNo,
      mockPageInfo.pageSize,
      mockDate,
      TEST_USER_ID,
    );

    expect(res).toEqual({
      code: ResultCodeEnum.success,
      message: '账单查询成功',
      data: {
        list: mockBillList,
        pageInfo: mockPageInfo,
      },
    });
  });

  it('新建账单', async () => {
    mockBillService.create.mockResolvedValue({
      code: ResultCodeEnum.success,
      message: '账单创建成功',
      data: null,
    });

    const res = await controller.create(
      {
        date: mockBillData.data,
        amount: mockBillData.amount,
        typeId: mockBillData.type.id,
        payType: mockBillData.payType,
      },
      TEST_USER_ID,
    );

    expect(res).toEqual({
      code: ResultCodeEnum.success,
      message: '账单创建成功',
      data: null,
    });
    expect(mockBillService.create).toHaveBeenCalledTimes(1);
  });

  it('更新账单', async () => {
    mockBillService.update.mockResolvedValue({
      code: ResultCodeEnum.success,
      message: '账单更新成功',
      data: null,
    });

    const res = await controller.update(
      {
        id: mockBillData.id,
        date: mockBillData.data,
        amount: mockBillData.amount,
        typeId: mockBillData.type.id,
        payType: mockBillData.payType,
      },
      TEST_USER_ID,
    );

    expect(res).toEqual({
      code: ResultCodeEnum.success,
      message: '账单更新成功',
      data: null,
    });

    expect(mockBillService.update).toHaveBeenCalledTimes(1);
  });

  it('软删除账单', async () => {
    mockBillService.delete.mockResolvedValue({
      code: ResultCodeEnum.success,
      message: '账单删除成功',
      data: null,
    });

    const res = await controller.delete(TEST_BILL_ID, TEST_USER_ID);

    expect(res).toEqual({
      code: ResultCodeEnum.success,
      message: '账单删除成功',
      data: null,
    });

    expect(mockBillService.delete).toHaveBeenCalledTimes(1);
  });
});
