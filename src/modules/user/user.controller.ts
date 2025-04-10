import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from '@/modules/user/dto/register-user.dto';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginUserDto } from '@/modules/user/dto/login-user.dto';

@ApiTags('用户模块')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '用户注册' })
  @ApiBody({ type: RegisterUserDto })
  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    return await this.userService.register(dto);
  }

  @ApiOperation({ summary: '用户登录接口' })
  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    return await this.userService.login(dto);
  }

  @ApiOperation({ summary: '微信登录' })
  @Get('wechat/login')
  async wechatLogin(@Query('code') code: string) {
    if (!code || typeof code !== 'string') {
      throw new BadRequestException('code参数错误');
    }

    return await this.userService.loginWechat(code);
  }
}
