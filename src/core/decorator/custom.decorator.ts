import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { REQUIRE_LOGIN } from '@/core/common/constant';
import { Request } from 'express';

export const RequireLogin = () => SetMetadata(REQUIRE_LOGIN, true);

export const UserInfo = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();

    if (!req.user) {
      return null;
    }

    return key ? req.user?.[key] : req.user;
  },
);
