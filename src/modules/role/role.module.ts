import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from '@/modules/role/entities/role.entity';
import { UserService } from '@/modules/user/user.service';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { PermissionEntity } from '@/modules/permission/entities/permission.entity';
import { AxiosModule } from '@/core/axios/axios.module';
import { CaptchaModule } from '@/core/captcha/captcha.module';
import { RedisModule } from '@/core/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoleEntity, UserEntity, PermissionEntity]),
    AxiosModule,
    CaptchaModule,
    RedisModule,
  ],
  controllers: [RoleController],
  providers: [RoleService, UserService],
})
export class RoleModule {}
