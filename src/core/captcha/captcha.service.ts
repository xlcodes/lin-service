import { Inject, Injectable, Logger } from '@nestjs/common';
import { createMath } from '@/core/utils/captcha';
import { v4 as uuid } from 'uuid';
import { RedisService } from '@/core/redis/redis.service';
import { ResultData } from '@/core/utils/result';
import { CacheEnum } from '@/core/common/constant';

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  @Inject(RedisService)
  private readonly redisService: RedisService;

  // 验证码下发
  async generateCode() {
    const captchaInfo = createMath();
    const id = uuid();

    const data = {
      img: captchaInfo.data,
      uuid: id,
    };

    try {
      await this.redisService.set(
        `${CacheEnum.CAPTCHA_CODE_KEY}${id}`,
        captchaInfo.text.toLowerCase(),
        1000 * 60 * 5,
      );
      return ResultData.ok(data, '验证码生成成功');
    } catch (err) {
      this.logger.error(err);
      return ResultData.fail(500, '生成验证码错误，请重试');
    }
  }

  // 校验验证码
  async verify(code: string, uuid: string) {
    const key = `${CacheEnum.CAPTCHA_CODE_KEY}${uuid}`;
    try {
      const cache = await this.redisService.get(key);

      if (cache.toLowerCase() !== code.toLowerCase()) {
        return false;
      }
      // 校验成功删除缓存，防止多次使用验证码
      await this.redisService.del(key);

      return true;
    } catch (err) {
      this.logger.error(err);
      return false;
    }
  }
}
