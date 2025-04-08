import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CreateBillTypeDto,
  UpdateBillTypeDto,
} from '@/modules/bill/dto/bill-type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BillTypeEntity } from '@/modules/bill/entities/bill-type.entity';
import { IsNull, Repository } from 'typeorm';
import { UserService } from '@/modules/user/user.service';
import { ResultData } from '@/core/utils/result';
import { ResultCodeEnum } from '@/core/common/constant';

@Injectable()
export class BillTypeService {
  private readonly logger = new Logger(BillTypeService.name);

  @InjectRepository(BillTypeEntity)
  private readonly billTypeRepository: Repository<BillTypeEntity>;

  @Inject(UserService)
  private readonly userService: UserService;

  private async findUserByUid(uid: number) {
    return await this.userService.findByUserId(uid);
  }

  async create(dto: CreateBillTypeDto, uid: number) {
    const user = await this.findUserByUid(uid);

    if (!user) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前用户不存在',
      );
    }

    const foundBillType = await this.billTypeRepository.findOne({
      where: {
        name: dto.name,
      },
    });

    if (foundBillType) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前账单分类已存在',
      );
    }

    const billType = new BillTypeEntity();
    billType.name = dto.name;
    billType.payType = dto.payType;
    billType.createdAt = new Date();
    billType.updatedAt = new Date();
    billType.user = user;

    try {
      await this.billTypeRepository.save(billType);
      return ResultData.ok(null, '账单分类创建成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '账单分类创建失败');
    }
  }

  async update(dto: UpdateBillTypeDto, uid: number) {
    const user = await this.findUserByUid(uid);
    if (!user) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前用户不存在',
      );
    }

    const billType = await this.billTypeRepository.findOne({
      where: {
        id: dto.id,
      },
      relations: ['user'],
    });

    if (!billType || billType.deletedAt) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前账单分类不存在',
      );
    }

    if (billType.user.uid !== uid) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '暂无修改权限',
      );
    }

    billType.name = dto.name;
    billType.payType = dto.payType;
    billType.updatedAt = new Date();

    try {
      await this.billTypeRepository.save(billType);
      return ResultData.ok(null, '账单分类修改成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '账单分类修改失败');
    }
  }

  async delete(bid: number, uid: number) {
    const user = await this.findUserByUid(uid);
    if (!user) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前用户不存在',
      );
    }

    const billType = await this.billTypeRepository.findOne({
      where: {
        id: bid,
      },
      relations: ['user'],
    });

    if (!billType || billType.deletedAt) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前账单分类不存在',
      );
    }

    if (billType.user.uid !== uid) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '暂无删除权限',
      );
    }

    billType.deletedAt = new Date();

    try {
      await this.billTypeRepository.save(billType);
      return ResultData.ok(null, '账单分类删除成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '账单分类删除失败');
    }
  }

  /**
   * 账单分类恢复接口
   * 仅管理员可恢复
   * @param bid
   * @param uid
   */
  async recover(bid: number, uid: number) {
    const user = await this.findUserByUid(uid);

    if (!user) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前用户不存在',
      );
    }

    if (user.isAdmin === '0') {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前用户暂无恢复权限',
      );
    }

    const billType = await this.billTypeRepository.findOne({
      where: {
        id: bid,
      },
      relations: ['user'],
    });

    if (!billType) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前账单分类不存在',
      );
    }

    if (!billType.deletedAt) {
      return ResultData.ok(null, '账单分类恢复成功');
    }

    billType.deletedAt = null;

    try {
      await this.billTypeRepository.save(billType);
      return ResultData.ok(null, '账单分类恢复成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '账单分类恢复失败');
    }
  }

  async list(pageNo: number, pageSize: number, uid: number) {
    const user = await this.findUserByUid(uid);

    if (!user) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前用户不存在',
      );
    }

    const skipCount = (pageNo - 1) * pageSize;

    try {
      const [list, total] = await this.billTypeRepository.findAndCount({
        where: {
          user: {
            uid: uid,
          },
          deletedAt: IsNull(),
        },
        skip: skipCount,
        take: pageSize,
        select: {
          id: true,
          name: true,
        },
      });
      return ResultData.ok(
        {
          list,
          pageInfo: {
            total,
            pageNo,
            pageSize,
          },
        },
        '列表数据获取成功',
      );
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '列表数据获取失败');
    }
  }
}
