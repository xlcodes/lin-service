import { Response } from 'express';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionsFilter } from '@/core/filters/http-exceptions-filter';
import { ResultData } from '@/core/utils/result';

describe('HttpExceptionsFilter', () => {
  let filter: HttpExceptionsFilter;

  beforeEach(() => {
    filter = new HttpExceptionsFilter();
  });

  function mockArgumentsHost(mockResponse: Partial<Response>) {
    return {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;
  }

  it('should format array message from exception response', () => {
    const mockJson = jest.fn().mockReturnThis();
    const mockEnd = jest.fn();
    const response = {
      status: jest.fn().mockReturnThis(),
      json: mockJson,
      end: mockEnd,
    };

    const exception = new HttpException(
      { message: ['字段A错误', '字段B错误'] },
      HttpStatus.BAD_REQUEST,
    );
    const host = mockArgumentsHost(response);

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(mockJson).toHaveBeenCalledWith(
      ResultData.fail(HttpStatus.BAD_REQUEST, '字段A错误,字段B错误', null),
    );
    expect(mockEnd).toHaveBeenCalled();
  });

  it('should format single string message from exception response', () => {
    const mockJson = jest.fn().mockReturnThis();
    const mockEnd = jest.fn();
    const response = {
      status: jest.fn().mockReturnThis(),
      json: mockJson,
      end: mockEnd,
    };

    const exception = new HttpException(
      { message: '自定义错误信息' },
      HttpStatus.NOT_FOUND,
    );
    const host = mockArgumentsHost(response);

    filter.catch(exception, host);

    expect(mockJson).toHaveBeenCalledWith(
      ResultData.fail(HttpStatus.NOT_FOUND, '自定义错误信息', null),
    );
  });

  it('should fallback to exception.message if no structured message', () => {
    const mockJson = jest.fn().mockReturnThis();
    const mockEnd = jest.fn();
    const response = {
      status: jest.fn().mockReturnThis(),
      json: mockJson,
      end: mockEnd,
    };

    const exception = new HttpException(
      '普通错误字符串',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const host = mockArgumentsHost(response);

    filter.catch(exception, host);

    expect(mockJson).toHaveBeenCalledWith(
      ResultData.fail(HttpStatus.INTERNAL_SERVER_ERROR, '普通错误字符串', null),
    );
  });
});
