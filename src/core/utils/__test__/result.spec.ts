import { ResultData } from '@/core/utils/result';
import { ResultCodeEnum } from '@/core/common/constant';

describe('ResultData', () => {
  describe('构造函数', () => {
    it('应该正确初始化实例', () => {
      const res = new ResultData(200, '自定义消息', { key: 'test-value' });

      expect(res.code).toBe(200);
      expect(res.message).toBe('自定义消息');
      expect(res.data).toEqual({ key: 'test-value' });
    });

    it('当没有提供消息时应使用默认成功消息', () => {
      const result = new ResultData(ResultCodeEnum.success, undefined, null);

      expect(result.message).toBe('请求成功');
    });

    it('当没有提供数据时应允许数据为undefined', () => {
      const result = new ResultData(ResultCodeEnum.success, '测试');

      expect(result.data).toBeUndefined();
    });
  });

  describe('静态方法 ok', () => {
    it('应该创建成功的响应对象', () => {
      const data = { id: 1, name: '测试' };
      const result = ResultData.ok(data);

      expect(result.code).toBe(ResultCodeEnum.success);
      expect(result.message).toBe('请求成功');
      expect(result.data).toEqual(data);
    });

    it('应该支持自定义成功消息', () => {
      const customMessage = '操作成功完成';
      const result = ResultData.ok(null, customMessage);

      expect(result.message).toBe(customMessage);
    });

    it('应该处理各种数据类型', () => {
      const testCases = [
        { data: '字符串', type: 'string' },
        { data: 123, type: 'number' },
        { data: { obj: true }, type: 'object' },
        { data: ['array'], type: 'array' },
        { data: null, type: 'null' },
        { data: undefined, type: 'undefined' },
      ];

      testCases.forEach(({ data }) => {
        const result = ResultData.ok(data);
        expect(result.data).toBe(data);
      });
    });
  });

  describe('静态方法 fail', () => {
    it('应该创建失败的响应对象', () => {
      const errorCode = ResultCodeEnum.error;
      const errorMessage = '参数错误';
      const errorData = { field: 'username' };

      const result = ResultData.fail(errorCode, errorMessage, errorData);

      expect(result.code).toBe(errorCode);
      expect(result.message).toBe(errorMessage);
      expect(result.data).toEqual(errorData);
    });

    it('当没有提供错误码时应使用默认错误码', () => {
      const result = ResultData.fail(undefined, '错误');

      expect(result.code).toBe(ResultCodeEnum.error);
    });

    it('当没有提供错误消息时应使用默认错误消息', () => {
      const result = ResultData.fail(ResultCodeEnum.error);

      expect(result.message).toBe('服务器异常');
    });

    it('应该处理各种错误情况', () => {
      const testCases = [
        { code: 401, message: '未授权' },
        { code: 403, message: '禁止访问' },
        { code: ResultCodeEnum.error, message: '服务器错误' },
      ];

      testCases.forEach(({ code, message }) => {
        const result = ResultData.fail(code, message);
        expect(result.code).toBe(code);
        expect(result.message).toBe(message);
      });
    });
  });

  describe('静态方法 exceptionFail', () => {
    it('应该创建失败的响应对象', () => {
      const errorCode = ResultCodeEnum.exception_error;
      const errorMessage = '参数错误';
      const errorData = { field: 'username' };

      const result = ResultData.exceptionFail(
        errorCode,
        errorMessage,
        errorData,
      );

      expect(result.code).toBe(errorCode);
      expect(result.message).toBe(errorMessage);
      expect(result.data).toEqual(errorData);
    });

    it('当没有提供错误码时应使用默认错误码', () => {
      const result = ResultData.exceptionFail(undefined, '错误');

      expect(result.code).toBe(ResultCodeEnum.exception_error);
    });

    it('当没有提供错误消息时应使用默认错误消息', () => {
      const result = ResultData.exceptionFail(ResultCodeEnum.exception_error);
      expect(result.message).toBe('业务异常');
    });
  });

  describe('边界情况', () => {
    it('应该处理空字符串消息', () => {
      const result1 = new ResultData(200, '');
      expect(result1.message).toBe('请求成功');

      const result2 = ResultData.ok(null, '');
      expect(result2.message).toBe('请求成功');
    });

    it('应该处理极长的消息', () => {
      const longMessage = 'a'.repeat(10000);
      const result = ResultData.fail(500, longMessage);

      expect(result.message).toBe(longMessage);
    });

    it('应该处理特殊字符消息', () => {
      const specialMessage = '!@#$%^&*()_+{}|:"<>?~`';
      const result = ResultData.fail(400, specialMessage);

      expect(result.message).toBe(specialMessage);
    });

    it('应该处理嵌套复杂对象数据', () => {
      const complexData = {
        date: new Date(),
        nested: {
          array: [1, 2, { prop: 'value' }],
          func: () => 'test',
        },
      };

      const result = ResultData.ok(complexData);
      expect(result.data).toEqual(complexData);
    });
  });
});
