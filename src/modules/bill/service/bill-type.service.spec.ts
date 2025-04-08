import { Test, TestingModule } from '@nestjs/testing';
import { BillTypeService } from './bill-type.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BillTypeEntity } from '@/modules/bill/entities/bill-type.entity';
import { UserService } from '@/modules/user/user.service';
import { PayTypeEnum } from '@/core/enum/bill.enum';
import { ResultCodeEnum } from '@/core/common/constant';

const createMockBillType = () => {
  return {
    id: 1,
    name: 'test-name',
    payType: PayTypeEnum.PAID,
  };
};

const testUid = 1;

describe('BillTypeService', () => {
  let service: BillTypeService;

  const mockUserService = {
    findByUserId: jest.fn(),
  };

  const mockBillTypeRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
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

  beforeEach(() => {
    // 模拟时间
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-04-01 12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('获取账单分类列表数据', () => {
    const testPageNo = 1;
    const testPageSize = 10;

    it('当前用户不存在', async () => {
      mockUserService.findByUserId.mockResolvedValue(null);

      const res = await service.list(testPageNo, testPageSize, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('查询指定分页的数据', async () => {
      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });

      mockBillTypeRepo.findAndCount.mockResolvedValue([[], 10]);

      const res = await service.list(testPageNo, testPageSize, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.success,
        message: '列表数据获取成功',
        data: {
          list: [],
          pageInfo: {
            pageNo: testPageNo,
            total: 10,
            pageSize: testPageSize,
          },
        },
      });
    });

    it('查询分页数据异常', async () => {
      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });

      mockBillTypeRepo.findAndCount.mockImplementation(() => {
        throw new Error('查询分页数据异常');
      });

      const res = await service.list(testPageNo, testPageSize, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.error,
        message: '列表数据获取失败',
        data: undefined,
      });
    });
  });

  describe('新建账单分类', () => {
    it('当前用户不存在', async () => {
      const mockBillType = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue(null);

      const res = await service.create(mockBillType, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('当前账单分类已经存在', async () => {
      const mockBillType = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockBillTypeRepo.findOne.mockResolvedValue(mockBillType);

      const res = await service.create(mockBillType, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单分类已存在',
        data: undefined,
      });
    });

    it('账单分类新建异常', async () => {
      const mockBillType = createMockBillType();
      const mockUser = {
        uid: 1,
        username: 'test-name',
      };

      mockUserService.findByUserId.mockResolvedValue({
        uid: mockUser.uid,
      });

      mockBillTypeRepo.findOne.mockResolvedValue(null);

      mockBillTypeRepo.save.mockImplementation(() => {
        throw new Error('新建账单分类异常');
      });

      const res = await service.create(mockBillType, mockUser.uid);

      expect(res).toEqual({
        code: ResultCodeEnum.error,
        message: '账单分类创建失败',
        data: undefined,
      });

      expect(mockBillTypeRepo.save).toHaveBeenCalled();
    });

    it('账单分类新建成功', async () => {
      const mockBillType = createMockBillType();
      const mockUser = {
        uid: 1,
        username: 'test-name',
      };

      mockUserService.findByUserId.mockResolvedValue({
        uid: mockUser.uid,
      });

      mockBillTypeRepo.findOne.mockResolvedValue(null);

      mockBillTypeRepo.save.mockResolvedValue({
        name: mockBillType.name,
        payType: mockBillType.payType,
        user: mockUser,
      });

      const res = await service.create(mockBillType, mockUser.uid);

      expect(res).toEqual({
        code: ResultCodeEnum.success,
        message: '账单分类创建成功',
        data: null,
      });

      expect(mockBillTypeRepo.save).toHaveBeenCalledWith({
        name: mockBillType.name,
        payType: mockBillType.payType,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { uid: mockUser.uid },
      });
    });
  });

  describe('修改账单', () => {
    it('当前用户不存在', async () => {
      const mockBillType = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue(null);

      const res = await service.update(mockBillType, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('当前账单分类不存在', async () => {
      const mockBillType = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockBillTypeRepo.findOne.mockResolvedValue(null);

      const res = await service.update(mockBillType, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单分类不存在',
        data: undefined,
      });
      expect(mockBillTypeRepo.findOne).toHaveBeenCalledWith({
        where: {
          id: mockBillType.id,
        },
        relations: ['user'],
      });
    });

    it('被删除的账单分类不可修改', async () => {
      const mockBillType = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...mockBillType,
        deletedAt: new Date(),
      });

      const res = await service.update(mockBillType, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单分类不存在',
        data: undefined,
      });
      expect(mockBillTypeRepo.findOne).toHaveBeenCalledWith({
        where: {
          id: mockBillType.id,
        },
        relations: ['user'],
      });
    });

    it('当前用户无修改权限', async () => {
      const mockBillType = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...mockBillType,
        user: { uid: 2 },
      });

      const res = await service.update(mockBillType, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '暂无修改权限',
        data: undefined,
      });
      expect(mockBillTypeRepo.findOne).toHaveBeenCalled();
    });

    it('账单分类修改异常', async () => {
      const mockBillType = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...mockBillType,
        user: { uid: testUid },
      });
      mockBillTypeRepo.save.mockImplementation(() => {
        throw new Error('账单分类修改异常');
      });

      const res = await service.update(mockBillType, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.error,
        message: '账单分类修改失败',
        data: undefined,
      });
      expect(mockBillTypeRepo.save).toHaveBeenCalledWith({
        id: mockBillType.id,
        name: mockBillType.name,
        payType: mockBillType.payType,
        updatedAt: new Date(),
        user: { uid: testUid },
      });
    });

    it('账单分类修改成功', async () => {
      const mockBillType = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...mockBillType,
        user: { uid: testUid },
      });
      mockBillTypeRepo.save.mockResolvedValue({
        ...mockBillType,
      });

      const res = await service.update(mockBillType, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.success,
        message: '账单分类修改成功',
        data: null,
      });
      expect(mockBillTypeRepo.save).toHaveBeenCalledWith({
        id: mockBillType.id,
        name: mockBillType.name,
        payType: mockBillType.payType,
        updatedAt: new Date(),
        user: { uid: testUid },
      });
    });
  });

  describe('删除账单分类', () => {
    const testBillTypeId = 1;

    it('当前用户不存在', async () => {
      mockUserService.findByUserId.mockResolvedValue(null);

      const res = await service.delete(testBillTypeId, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('账单分类不存在', async () => {
      const mockBillType = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockBillTypeRepo.findOne.mockResolvedValue(null);

      const res = await service.delete(testBillTypeId, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单分类不存在',
        data: undefined,
      });
      expect(mockBillTypeRepo.findOne).toHaveBeenCalledWith({
        where: {
          id: mockBillType.id,
        },
        relations: ['user'],
      });
    });

    it('账单分类已被删除', async () => {
      const mockBillType = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...mockBillType,
        user: { uid: testUid },
        deletedAt: new Date(),
      });

      const res = await service.delete(testBillTypeId, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单分类不存在',
        data: undefined,
      });
      expect(mockBillTypeRepo.findOne).toHaveBeenCalledWith({
        where: {
          id: mockBillType.id,
        },
        relations: ['user'],
      });
    });

    it('当前用户暂无删除权限', async () => {
      const mockBillType = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...mockBillType,
        user: { uid: 2 },
      });

      const res = await service.delete(testBillTypeId, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '暂无删除权限',
        data: undefined,
      });
      expect(mockBillTypeRepo.findOne).toHaveBeenCalled();
    });

    it('账单删除异常', async () => {
      const mockBillType = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...mockBillType,
        user: { uid: testUid },
      });
      mockBillTypeRepo.save.mockImplementation(() => {
        throw new Error('删除账单分类异常');
      });

      const res = await service.delete(testBillTypeId, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.error,
        message: '账单分类删除失败',
        data: undefined,
      });
      expect(mockBillTypeRepo.save).toHaveBeenCalledWith({
        id: mockBillType.id,
        name: mockBillType.name,
        payType: mockBillType.payType,
        deletedAt: new Date(),
        user: { uid: testUid },
      });
    });

    it('账单删除成功', async () => {
      const mockBillType = createMockBillType();

      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...mockBillType,
        user: { uid: testUid },
      });
      mockBillTypeRepo.save.mockResolvedValue({
        ...mockBillType,
      });

      const res = await service.delete(testBillTypeId, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.success,
        message: '账单分类删除成功',
        data: null,
      });
      expect(mockBillTypeRepo.save).toHaveBeenCalledWith({
        id: mockBillType.id,
        name: mockBillType.name,
        payType: mockBillType.payType,
        deletedAt: new Date(),
        user: { uid: testUid },
      });
    });
  });

  describe('恢复账单分类', () => {
    const testBillTypeId = 1;

    it('当前用户不存在', async () => {
      mockUserService.findByUserId.mockResolvedValue(null);

      const res = await service.recover(testBillTypeId, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户不存在',
        data: undefined,
      });
    });

    it('当前用户暂无恢复权限', async () => {
      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
        isAdmin: '0',
      });

      const res = await service.recover(testBillTypeId, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前用户暂无恢复权限',
        data: undefined,
      });
    });

    it('当前账单分类不存在', async () => {
      const mockBillType = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockBillTypeRepo.findOne.mockResolvedValue(null);

      const res = await service.recover(testBillTypeId, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.exception_error,
        message: '当前账单分类不存在',
        data: undefined,
      });
      expect(mockBillTypeRepo.findOne).toHaveBeenCalledWith({
        where: {
          id: mockBillType.id,
        },
        relations: ['user'],
      });
    });

    it('账单分类未被删除', async () => {
      const mockBillType = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...mockBillType,
        user: { uid: testUid },
        deletedAt: null,
      });

      const res = await service.recover(testBillTypeId, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.success,
        message: '账单分类恢复成功',
        data: null,
      });
    });

    it('账单删除异常', async () => {
      const mockBillType = createMockBillType();
      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...mockBillType,
        deletedAt: new Date(),
        user: { uid: testUid },
      });
      mockBillTypeRepo.save.mockImplementation(() => {
        throw new Error('账单分类恢复异常');
      });

      const res = await service.recover(testBillTypeId, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.error,
        message: '账单分类恢复失败',
        data: undefined,
      });
      expect(mockBillTypeRepo.save).toHaveBeenCalledWith({
        id: mockBillType.id,
        name: mockBillType.name,
        payType: mockBillType.payType,
        deletedAt: null,
        user: { uid: testUid },
      });
    });

    it('账单恢复成功', async () => {
      const mockBillType = createMockBillType();

      mockUserService.findByUserId.mockResolvedValue({
        uid: testUid,
      });
      mockBillTypeRepo.findOne.mockResolvedValue({
        ...mockBillType,
        deletedAt: new Date(),
        user: { uid: testUid },
      });
      mockBillTypeRepo.save.mockResolvedValue({
        ...mockBillType,
      });

      const res = await service.recover(testBillTypeId, testUid);

      expect(res).toEqual({
        code: ResultCodeEnum.success,
        message: '账单分类恢复成功',
        data: null,
      });
      expect(mockBillTypeRepo.save).toHaveBeenCalledWith({
        id: mockBillType.id,
        name: mockBillType.name,
        payType: mockBillType.payType,
        deletedAt: null,
        user: { uid: testUid },
      });
    });
  });
});
