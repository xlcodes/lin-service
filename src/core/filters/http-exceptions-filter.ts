import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ResultData } from '@/core/utils/result';

@Catch(HttpException)
export class HttpExceptionsFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const res = exception.getResponse() as { message: string[] };
    const message = Array.isArray(res?.message)
      ? res.message?.join(',')
      : res?.message;

    const data = ResultData.fail(
      exception.getStatus(),
      message || exception.message || '服务器异常',
      null,
    );
    response.status(HttpStatus.OK).json(data).end();
  }
}
