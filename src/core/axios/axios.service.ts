import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WECHAT_BASE_URL } from '@/core/common/constant';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, map } from 'rxjs';

@Injectable()
export class AxiosService {
  private readonly logger = new Logger(AxiosService.name);

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  @Inject(HttpService)
  private readonly httpService: HttpService;

  async getWechatUserInfo(code: string) {
    const params = {
      secret: this.configService.get('wx_app_secret'),
      appid: this.configService.get('wx_appid'),
      js_code: code,
    };

    try {
      const result = await firstValueFrom(
        this.httpService
          .get(WECHAT_BASE_URL, { params })
          .pipe(map((response) => response.data)),
      );

      const { errcode, errmsg } = result;
      console.log('Received response:', result);

      if (errcode) {
        this.logger.error(`微信登录失败：${errcode} => ${errmsg}`);
        return null;
      }
      return result;
    } catch (err) {
      this.logger.error(err);
      return null;
    }
  }
}
