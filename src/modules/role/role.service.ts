import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from '@/modules/role/entities/role.entity';
import { In, IsNull, Repository } from 'typeorm';
import { UserService } from '@/modules/user/user.service';
import { ResultData } from '@/core/utils/result';
import { ResultCodeEnum } from '@/core/common/constant';
import { PermissionEntity } from '@/modules/permission/entities/permission.entity';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  @InjectRepository(RoleEntity)
  private readonly roleRepo: Repository<RoleEntity>;

  @InjectRepository(PermissionEntity)
  private readonly permissionRepo: Repository<PermissionEntity>;

  @Inject(UserService)
  private readonly userService: UserService;

  private async findAllPermissions(
    permissions: string[] = [],
  ): Promise<PermissionEntity[]> {
    try {
      return await this.permissionRepo.find({
        where: { name: In(permissions) },
      });
    } catch (err) {
      this.logger.error(err);
      return [];
    }
  }

  async create(dto: CreateRoleDto, uid: number) {
    // 查询当前用户是否存在
    const userIsNotFound = await this.userService.validateUser(uid);

    if (userIsNotFound) {
      return userIsNotFound;
    }

    // 查询当前角色是否存在
    const foundRole = await this.roleRepo.findOne({
      where: {
        name: dto.name,
      },
    });

    if (foundRole) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前角色已存在',
      );
    }

    const role = new RoleEntity();
    role.name = dto.name;
    role.description = dto.description;
    role.createdAt = new Date();
    role.updatedAt = new Date();

    // 处理权限
    if (dto.permissions.length > 0) {
      role.permissions = await this.findAllPermissions(dto.permissions);
    }

    try {
      await this.roleRepo.save(role);
      return ResultData.ok(null, '创建角色成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '创建角色失败');
    }
  }

  async findAll(pageNo: number, pageSize: number, uid: number) {
    // 查询当前用户是否存在
    const userIsNotFound = await this.userService.validateUser(uid);

    if (userIsNotFound) {
      return userIsNotFound;
    }

    const skipCount = (pageNo - 1) * pageSize;

    try {
      const [list, total] = await this.roleRepo.findAndCount({
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
        '查询角色成功',
      );
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '查询角色失败');
    }
  }

  async findOne(id: number, uid: number) {
    // 查询当前用户是否存在
    const userIsNotFound = await this.userService.validateUser(uid);

    if (userIsNotFound) {
      return userIsNotFound;
    }

    try {
      const data = await this.roleRepo.findOne({
        where: {
          id,
          deletedAt: IsNull(),
        },
        select: [
          'id',
          'name',
          'description',
          'permissions',
          'createdAt',
          'updatedAt',
        ],
        relations: {
          permissions: true,
        },
      });

      if (!data) {
        return ResultData.exceptionFail(
          ResultCodeEnum.exception_error,
          '当前角色不存在',
        );
      }

      return ResultData.ok(data, '查询角色成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '查询角色失败');
    }
  }

  async update(id: number, dto: UpdateRoleDto, uid: number) {
    // 查询当前用户是否存在
    const userIsNotFound = await this.userService.validateUser(uid);

    if (userIsNotFound) {
      return userIsNotFound;
    }

    const found = await this.roleRepo.findOne({
      where: {
        id,
      },
    });

    if (!found) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前角色不存在',
      );
    }

    found.name = dto.name;
    found.description = dto.description;
    found.updatedAt = new Date();

    // 判断是否需要更新权限
    if (dto.permissions.length > 0) {
      found.permissions = await this.findAllPermissions(dto.permissions);
    }

    try {
      await this.roleRepo.save(found);
      return ResultData.ok(null, '更新角色成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '更新角色失败');
    }
  }

  async remove(id: number, uid: number) {
    // 查询当前用户是否存在
    const userIsNotFound = await this.userService.validateUser(uid);

    if (userIsNotFound) {
      return userIsNotFound;
    }

    const found = await this.roleRepo.findOne({
      where: {
        id,
      },
    });

    if (!found) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前角色不存在',
      );
    }

    found.updatedAt = new Date();
    found.deletedAt = new Date();

    try {
      await this.roleRepo.save(found);
      return ResultData.ok(null, '删除角色成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '删除角色失败');
    }
  }
}
