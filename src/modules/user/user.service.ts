import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { Repository } from 'typeorm';
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
      Number(expiresInMs),
    );

    if (!cacheRes) {
      return null;
    }

    const token = this.jwtService.sign(options, {
      expiresIn,
    });

    return token;
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
    });

    console.log(user);

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
   * 根据uid查询用户详情
   * @param uid
   */
  async findByUserId(uid: number) {
    const user = await this.userRepository.findOne({
      where: {
        uid,
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
}
