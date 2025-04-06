import { Controller, Get, HttpStatus } from '@nestjs/common';
import { CaptchaService } from '@/core/captcha/captcha.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('验证码模块')
@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @ApiOperation({ summary: '验证码下发' })
  @ApiResponse({
    status: 200,
    description: '验证码生成成功',
  })
  @ApiResponse({
    status: 500,
    description: '生成验证码错误，请重试',
  })
  @Get()
  async captcha() {
    return await this.captchaService.generateCode();
  }
}
