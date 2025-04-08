import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { REQUIRE_IS_ADMIN, REQUIRE_LOGIN } from '@/core/common/constant';
import { Request } from 'express';

export const RequireLogin = () => SetMetadata(REQUIRE_LOGIN, true);
export const RequireIsAdmin = () => SetMetadata(REQUIRE_IS_ADMIN, true);

/**
 * 自定义管理员权限判断装饰器
 * 必须要先登录，然后才判断是否为管理员
 * @constructor
 */
export const IsAdmin = () => applyDecorators(RequireLogin(), RequireIsAdmin());

export const UserInfo = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();

    if (!req.user) {
      return null;
    }

    return key ? req.user?.[key] : req.user;
  },
);
