import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserService } from '@/modules/user/user.service';
import { CreateBillDto, UpdateBillDto } from '@/modules/bill/dto/bill.dto';
import { ResultData } from '@/core/utils/result';
import { ResultCodeEnum } from '@/core/common/constant';
import { InjectRepository } from '@nestjs/typeorm';
import { BillTypeEntity } from '@/modules/bill/entities/bill-type.entity';
import { Between, IsNull, Repository } from 'typeorm';
import { BillEntity } from '@/modules/bill/entities/bill.entity';
import { IPageInfo } from '@/core/types/common.type';

@Injectable()
export class BillService {
  private readonly logger = new Logger(BillService.name);

  @Inject(UserService)
  private readonly userService: UserService;

  @InjectRepository(BillTypeEntity)
  private readonly billTypeRepo: Repository<BillTypeEntity>;

  @InjectRepository(BillEntity)
  private readonly billRepo: Repository<BillEntity>;

  async create(dto: CreateBillDto, uid: number) {
    // 查询用户信息
    const user = await this.userService.findByUserId(uid);

    if (!user) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前用户不存在',
      );
    }
    // 查询账单分类是否存在
    const billType = await this.billTypeRepo.findOne({
      where: {
        id: dto.typeId,
      },
    });

    if (!billType) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前账单分类不存在',
      );
    }

    const bill = new BillEntity();
    bill.payType = dto.payType;
    bill.amount = dto.amount;
    bill.date = dto.date;
    bill.user = user;
    bill.type = billType;
    bill.createdAt = new Date();
    bill.updatedAt = new Date();

    try {
      await this.billRepo.save(bill);
      return ResultData.ok(null, '账单创建成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '账单创建失败');
    }
  }

  async update(dto: UpdateBillDto, uid: number) {
    const notFoundUser = await this.userService.validateUser(uid);

    if (notFoundUser) {
      return notFoundUser;
    }

    // 查询账单分类是否存在
    const billType = await this.billTypeRepo.findOne({
      where: {
        id: dto.typeId,
        user: {
          uid,
        },
      },
    });

    if (!billType) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前账单分类不存在',
      );
    }

    const foundBill = await this.billRepo.findOne({
      where: {
        id: dto.id,
      },
      relations: ['user'],
    });

    if (!foundBill || foundBill.deletedAt) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前账单不存在或已被删除',
      );
    }

    if (foundBill.user.uid !== uid) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '暂无修改权限',
      );
    }

    foundBill.payType = dto.payType;
    foundBill.amount = dto.amount;
    foundBill.date = dto.date;
    foundBill.type = billType;
    foundBill.updatedAt = new Date();

    try {
      await this.billRepo.save(foundBill);
      return ResultData.ok(null, '账单修改成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '账单修改失败');
    }
  }

  async delete(billId: number, uid: number) {
    const notFoundUser = await this.userService.validateUser(uid);

    if (notFoundUser) {
      return notFoundUser;
    }

    const foundBill = await this.billRepo.findOne({
      where: {
        id: billId,
        user: {
          uid,
        },
        deletedAt: null,
      },
    });

    if (!foundBill || foundBill.deletedAt) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前账单不存在',
      );
    }

    foundBill.deletedAt = new Date();

    try {
      await this.billRepo.save(foundBill);
      return ResultData.ok(null, '账单删除成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '账单删除失败');
    }
  }

  async list(
    pageInfo: IPageInfo,
    queryData: {
      date: Date;
    },
    uid: number,
  ) {
    // 用户是否存在检验
    const user = await this.userService.findByUserId(uid);

    if (!user) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前用户不存在',
      );
    }

    const { pageNo, pageSize } = pageInfo;
    const { date } = queryData;

    const condition: Record<string, any> = {
      user: {
        uid: user.uid,
      },
      deletedAt: IsNull(),
    };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      condition.date = Between(startDate, endDate);
    }

    const skipCount = (pageNo - 1) * pageSize;

    try {
      const [list, total] = await this.billRepo.findAndCount({
        where: condition,
        skip: skipCount,
        take: pageSize,
      });
      return ResultData.ok(
        {
          list,
          pageInfo: {
            pageNo,
            pageSize,
            total,
          },
        },
        '账单查询成功',
      );
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '账单查询失败');
    }
  }
}
