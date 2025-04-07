import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from '@/modules/user/dto/register-user.dto';
import { CaptchaService } from '@/core/captcha/captcha.service';
import { ResultData } from '@/core/utils/result';
import { ResultCodeEnum } from '@/core/common/constant';
import { md5 } from '@/core/utils/md5';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;

  @Inject(CaptchaService)
  private readonly captchaService: CaptchaService;

  async register(dto: RegisterUserDto) {
    // 验证码校验
    const res = await this.captchaService.verify(dto.code, dto.uuid);
    if (!res) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '验证码校验失败',
      );
    }

    const foundUser = await this.userRepository.findOneBy({
      username: dto.username,
    });

    if (foundUser) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前用户已存在',
      );
    }

    const user = new UserEntity();
    user.username = dto.username;
    user.password = md5(dto.password);
    user.nickName = dto.username;
    user.createdAt = new Date();
    user.updatedAt = new Date();

    try {
      await this.userRepository.save(user);
      return ResultData.ok(null, '用户注册成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(ResultCodeEnum.error, '用户注册失败');
    }
  }
}
