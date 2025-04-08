import { BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { generateParseIntPipe } from '@/core/utils/custom-pipe';

describe('generateParseIntPipe', () => {
  const fieldName = 'testField';
  const pipe = generateParseIntPipe(fieldName);
  const metadata: ArgumentMetadata = {
    type: 'query',
    data: fieldName,
    metatype: Number,
  };

  // 有效输入测试
  describe('有效输入', () => {
    it('应该正确转换字符串数字', async () => {
      const result = await pipe.transform('123', metadata);
      expect(result).toBe(123);
    });
  });

  // 无效输入测试
  describe('无效输入', () => {
    it('应该拒绝非数字字符串', () => {
      try {
        pipe.transform('abc', metadata);
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.message).toBe(`【${fieldName}】 应当传数字`);
      }
    });

    it('应该拒绝混合字符串', () => {
      try {
        pipe.transform('123abc', metadata);
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.message).toBe(`【${fieldName}】 应当传数字`);
      }
    });

    it('应该拒绝空字符串', () => {
      try {
        pipe.transform('', metadata);
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.message).toBe(`【${fieldName}】 应当传数字`);
      }
    });

    it('应该拒绝 "null" 字符串', () => {
      try {
        pipe.transform('null', metadata);
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.message).toBe(`【${fieldName}】 应当传数字`);
      }
    });

    it('应该拒绝 "undefined" 字符串', () => {
      try {
        pipe.transform('undefined', metadata);
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.message).toBe(`【${fieldName}】 应当传数字`);
      }
    });
  });

  // 边界值测试
  describe('边界值测试', () => {
    it('应该接受最大安全整数', async () => {
      const result = await pipe.transform(
        Number.MAX_SAFE_INTEGER.toString(),
        metadata,
      );
      expect(result).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('应该接受最小安全整数', async () => {
      const result = await pipe.transform(
        Number.MIN_SAFE_INTEGER.toString(),
        metadata,
      );
      expect(result).toBe(Number.MIN_SAFE_INTEGER);
    });
  });
});
