import { Test, TestingModule } from '@nestjs/testing';
import { RedisModule } from '@/core/redis/redis.module';
import { RedisService } from '@/core/redis/redis.service';
import { REDIS_CLIENT } from '@/core/common/constant';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

describe('RedisModule', () => {
  let moduleRef: TestingModule;
  let redisService: RedisService;

  const mockConnect = jest.fn();
  const mockClient = {
    connect: mockConnect,
    on: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'redis_host':
          return 'localhost';
        case 'redis_port':
          return '6379';
        case 'redis_pwd':
          return 'password';
        case 'redis_db':
          return 0;
      }
    }),
  };

  beforeEach(async () => {
    (createClient as jest.Mock).mockReturnValue(mockClient);
    mockConnect.mockResolvedValue(undefined); // 成功连接

    moduleRef = await Test.createTestingModule({
      imports: [RedisModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .compile();

    redisService = moduleRef.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create Redis client using config values', async () => {
    const redisClient = moduleRef.get(REDIS_CLIENT);

    expect(createClient).toHaveBeenCalledWith({
      socket: {
        host: 'localhost',
        port: 6379,
      },
      password: 'password',
      database: 0,
    });

    expect(mockConnect).toHaveBeenCalled();
    expect(redisClient).toBeDefined();
  });

  it('should export RedisService', () => {
    expect(redisService).toBeDefined();
    expect(redisService).toBeInstanceOf(RedisService);
  });

  it('should throw if Redis connection fails', async () => {
    mockConnect.mockRejectedValue(new Error('Redis connection failed'));

    const faultyFactory = async () => {
      const config = mockConfigService as any;
      const client = createClient({
        socket: {
          host: config.get('redis_host'),
          port: +config.get('redis_port'),
        },
        password: config.get('redis_pwd'),
        database: config.get('redis_db'),
      });

      await client.connect(); // 会抛错
    };

    await expect(faultyFactory()).rejects.toThrow('Redis connection failed');
  });
});
