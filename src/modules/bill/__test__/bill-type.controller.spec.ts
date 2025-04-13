import { Test, TestingModule } from '@nestjs/testing';
import { BillTypeController } from '../controller/bill-type.controller';
import { BillTypeService } from '@/modules/bill/service/bill-type.service';
import { ResultCodeEnum } from '@/core/common/constant';
import { PayTypeEnum } from '@/core/enum/bill.enum';

describe('BillTypeController', () => {
  let controller: BillTypeController;

  const mockBillTypeService = {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    recover: jest.fn(),
  };

  const testUid = 1;

  const mockBillTypeData = {
    id: 1,
    name: 'test-name',
    payType: PayTypeEnum.PAID,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillTypeController],
      providers: [
        {
          provide: BillTypeService,
          useValue: mockBillTypeService,
        },
      ],
    }).compile();

    controller = module.get<BillTypeController>(BillTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('分页数据列表获取', async () => {
    const mockListRes = {
      list: [
        {
          id: 1,
          name: '测试账单分类',
        },
      ],
      pageInfo: {
        pageNo: 1,
        pageSize: 10,
        total: 10,
      },
    };
    mockBillTypeService.list.mockResolvedValue({
      code: ResultCodeEnum.success,
      message: '列表数据获取成功',
      data: mockListRes,
    });

    const res = await controller.getList(1, 10, testUid);

    expect(res.code).toBe(ResultCodeEnum.success);
    expect(res.message).toBe('列表数据获取成功');
    expect(res.data).toEqual(mockListRes);
    expect(mockBillTypeService.list).toHaveBeenCalledTimes(1);
  });

  it('添加账单分类', async () => {
    mockBillTypeService.create.mockResolvedValue({
      code: ResultCodeEnum.success,
      message: '账单分类创建成功',
      data: null,
    });

    const res = await controller.create(
      {
        name: mockBillTypeData.name,
        payType: mockBillTypeData.payType,
      },
      testUid,
    );

    expect(res).toEqual({
      code: ResultCodeEnum.success,
      message: '账单分类创建成功',
      data: null,
    });
    expect(mockBillTypeService.create).toHaveBeenCalledTimes(1);
  });
  it('修改账单分类', async () => {
    mockBillTypeService.update.mockResolvedValue({
      code: ResultCodeEnum.success,
      message: '账单分类修改成功',
      data: null,
    });
    const res = await controller.update(mockBillTypeData, testUid);

    expect(res).toEqual({
      code: ResultCodeEnum.success,
      message: '账单分类修改成功',
      data: null,
    });

    expect(mockBillTypeService.update).toHaveBeenCalledTimes(1);
  });
  it('删除账单分类', async () => {
    mockBillTypeService.delete.mockResolvedValue({
      code: ResultCodeEnum.success,
      message: '账单分类删除成功',
      data: null,
    });

    const res = await controller.delete(mockBillTypeData.id, testUid);

    expect(res).toEqual({
      code: ResultCodeEnum.success,
      message: '账单分类删除成功',
      data: null,
    });
    expect(mockBillTypeService.delete).toHaveBeenCalledTimes(1);
  });
  it('恢复账单分类', async () => {
    mockBillTypeService.recover.mockResolvedValue({
      code: ResultCodeEnum.success,
      message: '账单分类恢复成功',
      data: null,
    });

    const res = await controller.recover(mockBillTypeData.id, testUid);

    expect(res).toEqual({
      code: ResultCodeEnum.success,
      message: '账单分类恢复成功',
      data: null,
    });

    expect(mockBillTypeService.recover).toHaveBeenCalledTimes(1);
  });
});
