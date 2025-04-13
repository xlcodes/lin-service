import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { AxiosModule } from '@/core/axios/axios.module';
import { CaptchaModule } from '@/core/captcha/captcha.module';
import { RedisModule } from '@/core/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    AxiosModule,
    CaptchaModule,
    RedisModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
