import { Test, TestingModule } from '@nestjs/testing';
import { CaptchaController } from '@/core/captcha/captcha.controller';
import { CaptchaService } from '@/core/captcha/captcha.service';
import { ResultData } from '@/core/utils/result';
import { ResultCodeEnum } from '@/core/common/constant';
import { TEST_ERROR, TEST_UUID } from '@/test/test.constant';

describe('CaptchaController', () => {
  let controller: CaptchaController;
  let captchaService: jest.Mocked<CaptchaService>;

  const TEST_IMG = 'test-img';
  const SUCCESS_MESSAGE = '验证码生成成功';
  const ERROR_MESSAGE = '生成验证码错误，请重试';
  const SUCCESS_RESPONSE = ResultData.ok(
    { uuid: TEST_UUID, img: TEST_IMG },
    SUCCESS_MESSAGE,
  );
  const ERROR_RESPONSE = ResultData.fail(ResultCodeEnum.error, ERROR_MESSAGE);

  beforeEach(async () => {
    // Initialize mocks
    captchaService = {
      generateCode: jest.fn().mockResolvedValue(SUCCESS_RESPONSE),
    } as unknown as jest.Mocked<CaptchaService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaptchaController],
      providers: [
        {
          provide: CaptchaService,
          useValue: captchaService,
        },
      ],
    }).compile();

    controller = module.get<CaptchaController>(CaptchaController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Swagger Decorators', () => {
    it('should have correct ApiOperation for captcha endpoint', () => {
      const apiOperation = Reflect.getMetadata(
        'swagger/apiOperation',
        controller.captcha,
      );
      expect(apiOperation).toEqual({ summary: '验证码下发' });
    });
  });

  describe('GET /captcha', () => {
    it('should return captcha data when generation succeeds', async () => {
      const result = await controller.captcha();

      expect(result).toEqual(SUCCESS_RESPONSE);
      expect(result.code).toBe(200);
      expect(result.data).toEqual({
        uuid: TEST_UUID,
        img: TEST_IMG,
      });
      expect(result.message).toBe(SUCCESS_MESSAGE);
      expect(captchaService.generateCode).toHaveBeenCalledTimes(1);
    });

    it('should return error response when generation fails', async () => {
      captchaService.generateCode.mockResolvedValueOnce(ERROR_RESPONSE);

      const result = await controller.captcha();

      expect(result).toEqual(ERROR_RESPONSE);
      expect(result.code).toBe(400);
      expect(result.message).toBe(ERROR_MESSAGE);
      expect(captchaService.generateCode).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const error = TEST_ERROR;
      captchaService.generateCode.mockRejectedValueOnce(error);

      await expect(controller.captcha()).rejects.toThrow(error);
      expect(captchaService.generateCode).toHaveBeenCalledTimes(1);
    });
  });
});
