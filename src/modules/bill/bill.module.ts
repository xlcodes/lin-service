import { Module } from '@nestjs/common';
import { BillService } from '@/modules/bill/service/bill.service';
import { BillController } from '@/modules/bill/controller/bill.controller';
import { BillTypeService } from '@/modules/bill/service/bill-type.service';
import { BillTypeController } from '@/modules/bill/controller/bill-type.controller';
import { UserService } from '@/modules/user/user.service';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { BillEntity } from '@/modules/bill/entities/bill.entity';
import { BillTypeEntity } from '@/modules/bill/entities/bill-type.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AxiosModule } from '@/core/axios/axios.module';
import { CaptchaModule } from '@/core/captcha/captcha.module';
import { RedisModule } from '@/core/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, BillTypeEntity, BillEntity]),
    AxiosModule,
    CaptchaModule,
    RedisModule,
  ],
  controllers: [BillController, BillTypeController],
  providers: [BillService, BillTypeService, UserService],
  exports: [BillService, BillTypeService],
})
export class BillModule {}
