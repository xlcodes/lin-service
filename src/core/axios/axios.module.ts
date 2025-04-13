import { Global, Module } from '@nestjs/common';
import { AxiosService } from './axios.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [AxiosService],
  exports: [AxiosService],
})
export class AxiosModule {}
