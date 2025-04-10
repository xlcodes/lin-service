import { Test, TestingModule } from '@nestjs/testing';
import { AxiosService } from './axios.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { WECHAT_BASE_URL } from '@/core/common/constant';
import { Logger } from '@nestjs/common';

describe('AxiosService', () => {
  let service: AxiosService;

  const TEST_APPID = 'test-appid';
  const TEST_APP_SECRET = 'test-app-secret';
  const TEST_DATE = new Date('2025-04-01 12:00:00');
  const TEST_CODE = 'test-code';
  const TEST_OPENID = 'test-openid';
  const TEST_ERR_CODE = 40226;
  const TEST_ERR_MSG = 'test-error-msg';

  const mockLogger = {
    error: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn((key) => {
      switch (key) {
        case 'wx_app_secret':
          return TEST_APP_SECRET;
        case 'wx_appid':
          return TEST_APPID;
        default:
          return '';
      }
    }),
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(TEST_DATE);

    mockHttpService.get
      .mockReset()
      .mockReturnValue(of({ data: { openid: TEST_OPENID } }));
    mockLogger.error.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AxiosService,
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AxiosService>(AxiosService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWechatUserInfo', () => {
    it('should return null when request fails', async () => {
      const mockError = new Error('Request failed');
      mockHttpService.get.mockImplementation(() => {
        throw mockError;
      });

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.getWechatUserInfo(TEST_CODE);

      expect(result).toBeNull();
      expect(loggerSpy).toHaveBeenCalledWith(mockError);
    });

    it('should return null when response contains error code', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: {
            errcode: TEST_ERR_CODE,
            errmsg: TEST_ERR_MSG,
          },
        }),
      );
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.getWechatUserInfo(TEST_CODE);

      expect(result).toBeNull();

      expect(mockHttpService.get).toHaveBeenCalledWith(WECHAT_BASE_URL, {
        params: {
          secret: TEST_APP_SECRET,
          appid: TEST_APPID,
          js_code: TEST_CODE,
        },
      });

      expect(loggerSpy).toHaveBeenCalledWith(
        `微信登录失败：${TEST_ERR_CODE} => ${TEST_ERR_MSG}`,
      );
    });

    it('should return openid when request succeeds', async () => {
      mockHttpService.get.mockReturnValue(
        of({ data: { openid: TEST_OPENID } }),
      );

      const res = await service.getWechatUserInfo(TEST_CODE);

      expect(res).toEqual({
        openid: TEST_OPENID,
      });
    });
  });
});
