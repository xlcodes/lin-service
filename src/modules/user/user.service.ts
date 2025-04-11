import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { IsNull, Repository } from 'typeorm';
import { CaptchaService } from '@/core/captcha/captcha.service';
import { ResultData } from '@/core/utils/result';
import { CacheEnum, ResultCodeEnum } from '@/core/common/constant';
import { md5 } from '@/core/utils/md5';
import { LoginUserDto } from '@/modules/user/dto/login-user.dto';
import { RegisterUserDto } from '@/modules/user/dto/register-user.dto';
import { RedisService } from '@/core/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import * as ms from 'ms';
import { AxiosService } from '@/core/axios/axios.service';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;

  @Inject(CaptchaService)
  private readonly captchaService: CaptchaService;

  @Inject(RedisService)
  private readonly redisService: RedisService;

  @Inject(JwtService)
  private readonly jwtService: JwtService;

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  @Inject(AxiosService)
  private readonly axiosService: AxiosService;

  /**
   * 生成基于用户信息的token
   * @param options
   */
  async createToken(options: { userId: number; uuid: string }) {
    const expiresIn = this.configService.get('jwt_expires_in');

    const expiresInMs = ms(expiresIn || '');

    const cacheRes = await this.redisService.set(
      `${CacheEnum.LOGIN_TOKEN_KEY}${options.userId}`,
      options.uuid,
      Number(expiresInMs) / 1000,
    );

    if (!cacheRes) {
      return null;
    }

    return this.jwtService.sign(options, {
      expiresIn,
    });
  }

  /**
   * token 解析
   * @param token
   */
  async verifyToken(token: string) {
    const res: Partial<{ userId: number; uuid: string }> = {};

    // 解析 token
    try {
      const data = this.jwtService.verify(token, {
        secret: this.configService.get('jwt_secret'),
      });

      if (data && data.userId && data.uuid) {
        res.userId = data.userId;
        res.uuid = data.uuid;
      }
    } catch (err) {
      this.logger.error(err);
      return null;
    }

    if (!res.userId) return null;

    // 查询 redis
    const cacheRedis = await this.redisService.get(
      `${CacheEnum.LOGIN_TOKEN_KEY}${res.userId}`,
    );

    if (!cacheRedis) return null;

    // 查数据库
    const foundUser = await this.userRepository.findOne({
      where: {
        uid: res.userId,
        deletedAt: IsNull(),
      },
      select: {
        password: false,
      },
    });

    if (!foundUser) return null;

    return foundUser;
  }

  /**
   * 用户注册
   * @param dto
   */
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
    // 添加默认头像
    user.avatarUrl = '/images/def-avatar.png';
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

  /**
   * 用户登录
   * @param dto
   */
  async login(dto: LoginUserDto) {
    const user = await this.userRepository.findOneBy({
      username: dto.username,
      deletedAt: IsNull(),
    });

    if (!user) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前用户不存在',
      );
    }

    if (user.password !== md5(dto.password)) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '密码错误',
      );
    }

    const id = uuid();

    const token = await this.createToken({
      userId: user.uid,
      uuid: id,
    });

    return ResultData.ok({ token }, '用户登录成功');
  }

  /**
   * 微信登录
   * @param code 微信授权码，有效期10分钟
   */
  async loginWechat(code: string) {
    // 获取 openid
    const wechatUserInfo = await this.axiosService.getWechatUserInfo(code);
    const { openid = '' } = wechatUserInfo || {};
    const id = uuid();

    if (!openid) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '微信登录失败',
      );
    }

    // 基于 openid 查询用户
    const user = await this.userRepository.findOneBy({
      openid,
      deletedAt: IsNull(),
    });

    if (user) {
      const token = await this.createToken({
        userId: user.uid,
        uuid: id,
      });

      return ResultData.ok({ token }, '微信用户登录成功');
    }

    // 执行注册逻辑
    const newUser = await this.registerByWechat(openid);

    if (!newUser) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '登录异常，请稍后再试！',
      );
    }

    const newToken = await this.createToken({
      userId: newUser.uid,
      uuid: id,
    });

    return ResultData.ok({ token: newToken }, '微信用户登录成功');
  }

  registerByWechat(openId: string) {
    const user = new UserEntity();

    const time = Date.now();

    user.openid = openId;
    user.username = `wechat_${time}`;
    user.nickName = `wechat_${time}`;
    user.avatarUrl = '';
    user.password = md5(this.configService.get('user_init_pwd') || '123456');
    user.createdAt = new Date();
    user.updatedAt = new Date();
    try {
      return this.userRepository.save(user);
    } catch (err) {
      this.logger.error(err);
      return null;
    }
  }

  /**
   * 根据uid查询用户详情
   * @param uid
   */
  async findByUserId(uid: number) {
    const user = await this.userRepository.findOne({
      where: {
        uid,
        deletedAt: IsNull(),
      },
      select: {
        password: false,
      },
    });

    if (!user) {
      this.logger.debug(`用户 ${uid} 详情获取失败`);
      return null;
    }

    return user;
  }

  /**
   * 检查当前用户是否为管理员
   * @param userId
   */
  async checkIsAdmin(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        uid: userId,
      },
    });

    if (!user) {
      return false;
    }

    return user.isAdmin;
  }

  /**
   * 检测当前用户是否存在
   * @param uid 用户唯一标识
   * @return {ResultData | null} null 则说明用户存在
   */
  async validateUser(uid: number): Promise<ResultData<unknown> | null> {
    const foundUser = await this.findByUserId(uid);

    if (!foundUser) {
      return ResultData.exceptionFail(
        ResultCodeEnum.exception_error,
        '当前用户不存在',
      );
    }

    return null;
  }
}
