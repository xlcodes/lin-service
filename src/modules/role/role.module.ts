import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from '@/modules/role/entities/role.entity';
import { UserService } from '@/modules/user/user.service';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { PermissionEntity } from '@/modules/permission/entities/permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoleEntity, UserEntity, PermissionEntity]),
  ],
  controllers: [RoleController],
  providers: [RoleService, UserService],
})
export class RoleModule {}
