import { SetMetadata } from '@nestjs/common';
import { REQUIRE_LOGIN } from '@/core/common/constant';

export const RequireLogin = () => SetMetadata(REQUIRE_LOGIN, true);
