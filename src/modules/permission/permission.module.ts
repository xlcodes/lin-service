import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionEntity } from '@/modules/permission/entities/permission.entity';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { UserService } from '@/modules/user/user.service';
import { AxiosModule } from '@/core/axios/axios.module';
import { CaptchaModule } from '@/core/captcha/captcha.module';
import { RedisModule } from '@/core/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PermissionEntity, UserEntity]),
    AxiosModule,
    CaptchaModule,
    RedisModule,
  ],
  controllers: [PermissionController],
  providers: [PermissionService, UserService],
})
export class PermissionModule {}
