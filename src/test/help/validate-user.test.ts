import { ResultData } from '@/core/utils/result';
import { ResultCodeEnum } from '@/core/common/constant';
import { TEST_USER_ID } from '@/test/test.constant';

export const mockUserService = {
  validateUser: jest.fn(),
  findByUserId: jest.fn(),
};

export const validateUser = async <T>(callback: () => Promise<T>) => {
  mockUserService.validateUser.mockResolvedValue(
    ResultData.exceptionFail(ResultCodeEnum.exception_error, '当前用户不存在'),
  );

  const result = await callback();

  expect(result).toEqual({
    code: ResultCodeEnum.exception_error,
    message: '当前用户不存在',
    data: undefined,
  });

  expect(mockUserService.validateUser).toHaveBeenCalledWith(TEST_USER_ID);

  mockUserService.validateUser.mockResolvedValue(null);
};
