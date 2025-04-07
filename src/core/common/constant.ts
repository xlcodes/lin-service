export const REDIS_CLIENT = 'REDIS_CLIENT';

export const REQUIRE_LOGIN = 'REQUIRE_LOGIN';

export enum ResultCodeEnum {
  success = 200,
  error = 400,
  exception_error = -1,
}

export enum CacheEnum {
  /**
   * 登录用户 redis key
   */
  LOGIN_TOKEN_KEY = 'login_tokens:',

  /**
   * 验证码 redis key
   */
  CAPTCHA_CODE_KEY = 'captcha_codes:',
}
