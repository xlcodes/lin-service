import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionEntity } from '@/modules/permission/entities/permission.entity';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { UserService } from '@/modules/user/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([PermissionEntity, UserEntity])],
  controllers: [PermissionController],
  providers: [PermissionService, UserService],
})
export class PermissionModule {}
