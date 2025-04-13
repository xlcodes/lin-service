import { Test, TestingModule } from '@nestjs/testing';
import { AxiosModule } from '@/core/axios/axios.module';
import { AxiosService } from '@/core/axios/axios.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('AxiosModule', () => {
  let moduleRef: TestingModule;
  let axiosService: AxiosService;

  const mockConfig = {
    get: jest.fn((key) => {
      switch (key) {
        case 'wx_app_secret':
          return 'test_wx_app_secret';
        case 'wx_appid':
          return 'test_wx_appid';
        default:
          return '';
      }
    }),
  };

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AxiosModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfig)
      .compile();

    axiosService = moduleRef.get<AxiosService>(AxiosService);
  });

  it('should be defined', () => {
    expect(axiosService).toBeDefined();
    expect(axiosService).toBeInstanceOf(AxiosService);
  });

  it('should import HttpModule correctly', () => {
    const imports = Reflect.getMetadata('imports', AxiosModule);
    expect(imports).toContain(HttpModule);
  });

  it('should import ConfigService correctly', () => {
    const imports = Reflect.getMetadata('imports', AxiosModule);
    expect(imports).toContain(ConfigModule);
  });
});
