import { BadRequestException } from '@nestjs/common';
import { generateParseIntPipe } from '@/core/utils/custom-pipe';

describe('generateParseIntPipe', () => {
  it('should parse valid integer', async () => {
    const pipe = generateParseIntPipe('age');
    expect(
      await pipe.transform('123', {
        type: 'param',
        metatype: Number,
        data: '',
      }),
    ).toBe(123);
  });

  it('should throw BadRequestException with custom message on invalid number', async () => {
    const pipe = generateParseIntPipe('age');

    try {
      await pipe.transform('abc', {
        type: 'param',
        metatype: Number,
        data: '',
      });
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect(e.message).toBe('【age】应该传数字');
    }
  });

  it('should throw BadRequestException with correct label', async () => {
    const pipe = generateParseIntPipe('amount');

    try {
      await pipe.transform('NaN', {
        type: 'query',
        metatype: Number,
        data: '',
      });
    } catch (e) {
      expect(e.message).toBe('【amount】应该传数字');
    }
  });

  it('should parse negative numbers', async () => {
    const pipe = generateParseIntPipe('amount');
    expect(
      await pipe.transform('-42', { type: 'body', metatype: Number, data: '' }),
    ).toBe(-42);
  });
});
