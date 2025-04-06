import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from '../common/constant';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Module({
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
})
export class RedisModule {}
