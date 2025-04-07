import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserService } from '@/modules/user/user.service';
import { REQUIRE_LOGIN } from '@/core/common/constant';
import { UserEntity } from '@/modules/user/entities/user.entity';

interface JwtUserData {
  userId: number;
  uuid: string;
}

declare module 'express' {
  interface Request {
    user: JwtUserData | UserEntity;
  }
}

@Injectable()
export class LoginGuard implements CanActivate {
  private readonly logger = new Logger(LoginGuard.name);

  @Inject()
  private reflector: Reflector;

  @Inject(UserService)
  private userService: UserService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const requireLogin = this.reflector.getAllAndOverride(REQUIRE_LOGIN, [
      context.getClass(),
      context.getHandler(),
    ]);

    if (!requireLogin) {
      return true;
    }

    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('当前用户未登录！');
    }

    const token = authorization.replace('Bearer ', '');

    const user = await this.userService.verifyToken(token);

    if (!user) {
      throw new UnauthorizedException('当前用户未登录！');
    }

    request.user = user;
    return true;
  }
}
