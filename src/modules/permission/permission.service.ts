import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PermissionEntity } from '@/modules/permission/entities/permission.entity';
import { IsNull, Repository } from 'typeorm';
import { ResultData } from '@/core/utils/result';
import { ResultCodeEnum } from '@/core/common/constant';
import { UserService } from '@/modules/user/user.service';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  @InjectRepository(PermissionEntity)
  private perRepo: Repository<PermissionEntity>;

  @Inject(UserService)
  private readonly userService: UserService;

  async create(dto: CreatePermissionDto, uid: number) {
    const userNotFound = await this.userService.validateUser(uid);

    if (userNotFound) {
      return userNotFound;
    }

    const found = await this.perRepo.findOne({
      where: {
        name: dto.name,
      },
    });

    if (found) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前权限已存在',
      );
    }

    const newPerm = new PermissionEntity();

    newPerm.name = dto.name;
    newPerm.description = dto.description;
    newPerm.createdAt = new Date();
    newPerm.updatedAt = new Date();

    try {
      await this.perRepo.save(newPerm);
      return ResultData.ok(null, '创建权限成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '创建权限失败');
    }
  }

  async findAll(pageNo: number, pageSize: number, uid: number) {
    const userNotFound = await this.userService.validateUser(uid);

    if (userNotFound) {
      return userNotFound;
    }

    const skipCount = (pageNo - 1) * pageSize;

    try {
      const [list, total] = await this.perRepo.findAndCount({
        where: {
          deletedAt: IsNull(),
        },
        skip: skipCount,
        take: pageSize,
        select: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
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
        '查询权限成功',
      );
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '查询权限失败');
    }
  }

  async findOne(id: number, uid: number) {
    const userNotFound = await this.userService.validateUser(uid);

    if (userNotFound) {
      return userNotFound;
    }

    try {
      const data = await this.perRepo.findOne({
        where: { id, deletedAt: IsNull() },
        select: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
      });

      if (!data) {
        return ResultData.exceptionFail(
          ResultCodeEnum.exception_error,
          '指定权限不存在',
        );
      }

      return ResultData.ok(data, `查询 ${id} 权限成功`);
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, `查询 ${id} 权限失败`);
    }
  }

  async update(id: number, dto: UpdatePermissionDto, uid: number) {
    const userNotFound = await this.userService.validateUser(uid);

    if (userNotFound) {
      return userNotFound;
    }

    const found = await this.perRepo.findOne({
      where: {
        id,
      },
    });

    if (!found) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '指定权限不存在',
      );
    }

    found.name = dto.name;
    found.description = dto.description;
    found.updatedAt = new Date();

    try {
      await this.perRepo.save(found);
      return ResultData.ok(null, '更新权限成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '更新权限失败');
    }
  }

  async remove(id: number, uid: number) {
    const userNotFound = await this.userService.validateUser(uid);

    if (userNotFound) {
      return userNotFound;
    }

    const found = await this.perRepo.findOne({
      where: {
        id,
      },
    });

    if (!found) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '指定权限不存在',
      );
    }

    found.deletedAt = new Date();
    found.updatedAt = new Date();

    try {
      await this.perRepo.save(found);
      return ResultData.ok(null, '删除权限成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '删除权限失败');
    }
  }
}
