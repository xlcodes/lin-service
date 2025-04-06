import { Test, TestingModule } from '@nestjs/testing';
import { CaptchaController } from './captcha.controller';
import { ResultData } from '@/core/utils/result';
import { CaptchaService } from '@/core/captcha/captcha.service';

describe('CaptchaController', () => {
  let controller: CaptchaController;

  const mockCaptchaService = {
    generateCode: jest
      .fn()
      .mockReturnValue(
        ResultData.ok({ uuid: 'test-uuid', img: 'test-img' }, '验证码生成成功'),
      ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaptchaController],
      providers: [
        {
          provide: CaptchaService,
          useValue: mockCaptchaService,
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

  describe('验证码获取', () => {
    it('成功获取验证码', async () => {
      const res = await controller.captcha();

      expect(res.code).toBe(200);
      expect(res.data).toEqual({
        uuid: 'test-uuid',
        img: 'test-img',
      });
      expect(res.message).toBe('验证码生成成功');
      expect(mockCaptchaService.generateCode).toHaveBeenCalled();
    });
  });
});
