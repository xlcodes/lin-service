import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from '../common/constant';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    RedisService,
    {
      provide: REDIS_CLIENT,
      async useFactory(config: ConfigService) {
        const client = createClient({
          socket: {
            host: config.get('redis_host'),
            port: +config.get('redis_port'),
          },
          password: config.get('redis_pwd'),
          database: config.get('redis_db'),
        });

        await client.connect();
        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
