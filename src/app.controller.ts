import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RequireLogin, UserInfo } from '@/core/decorator/custom.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @RequireLogin()
  getHello(@UserInfo() info: any): string {
    return this.appService.getHello();
  }
}
