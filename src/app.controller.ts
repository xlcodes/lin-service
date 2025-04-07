import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RequireLogin } from '@/core/decorator/custom.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @RequireLogin()
  getHello(): string {
    return this.appService.getHello();
  }
}
