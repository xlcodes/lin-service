import { ResultCodeEnum } from '@/core/common/constant';

export class ResultData<T> {
  code: number;
  data: T;
  message: string;

  constructor(code: number, message?: string, data?: T) {
    this.code = code;
    this.message = message || '请求成功';
    this.data = data;
  }

  static ok<T>(data: T, message?: string): ResultData<T> {
    return new ResultData<T>(
      ResultCodeEnum.success,
      message || '请求成功',
      data,
    );
  }

  static fail<T>(code: number, message?: string, data?: T) {
    return new ResultData<T>(
      code || ResultCodeEnum.error,
      message || '服务器异常',
      data,
    );
  }

  static exceptionFail<T>(code: number, message?: string, data?: T) {
    return new ResultData<T>(
      code || ResultCodeEnum.exception_error,
      message || '业务异常',
      data,
    );
  }
}
