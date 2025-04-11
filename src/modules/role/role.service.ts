import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from '@/modules/role/entities/role.entity';
import { Repository } from 'typeorm';
import { UserService } from '@/modules/user/user.service';
import { ResultData } from '@/core/utils/result';
import { ResultCodeEnum } from '@/core/common/constant';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  @InjectRepository(RoleEntity)
  private readonly roleRepo: Repository<RoleEntity>;

  @Inject(UserService)
  private readonly userService: UserService;

  async create(dto: CreateRoleDto, uid: number) {
    // 查询当前用户是否存在
    const user = await this.userService.findByUserId(uid);

    if (!user) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前用户不存在',
      );
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

    /**
     * 查询角色id分别为 1，2，3的数据代码示例
     * const res = await this.roleRepo.find({
     *   where: {
     *     id: In([1, 2, 3]),
     *   },
     * });
     */

    try {
      await this.roleRepo.save(role);
      return ResultData.ok(null, '创建角色成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '创建角色失败');
    }
  }

  async findAll(pageNo: number, pageSize: number, uid: number) {
    return `This action returns all role`;
  }

  async findOne(id: number, uid: number) {
    return `This action returns a #${id} role`;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto, uid: number) {
    return `This action updates a #${id} role`;
  }

  async remove(id: number, uid: number) {
    return `This action removes a #${id} role`;
  }
}
