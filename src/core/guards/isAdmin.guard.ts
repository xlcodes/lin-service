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
import { REQUIRE_IS_ADMIN } from '@/core/common/constant';

@Injectable()
export class IsAdminGuard implements CanActivate {
  private readonly logger = new Logger(IsAdminGuard.name);

  @Inject()
  private reflector: Reflector;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const requireIsAdmin = this.reflector.getAllAndOverride(REQUIRE_IS_ADMIN, [
      context.getClass(),
      context.getHandler(),
    ]);

    if (!requireIsAdmin) {
      return true;
    }

    if (!request.user) {
      this.logger.debug(`当前用户暂无管理员权限`);
      throw new UnauthorizedException('当前用户暂无管理员权限');
    }

    if ((request?.user as any)?.isAdmin !== '1') {
      this.logger.debug(
        `当前用户 ${(request?.user as any)?.uid || ''} 暂无管理员权限`,
      );
      throw new UnauthorizedException(
        `当前用户 ${(request?.user as any)?.uid || ''} 暂无管理员权限`,
      );
    }

    return true;
  }
}
