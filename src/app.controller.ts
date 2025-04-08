import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { IsAdmin, UserInfo } from '@/core/decorator/custom.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @IsAdmin()
  getHello(@UserInfo() info: any): string {
    console.log(info);
    return this.appService.getHello();
  }
}
