import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { RedisModule } from './core/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.join(__dirname, '.env'),
    }),
    TypeOrmModule.forRootAsync({
      useFactory(config: ConfigService) {
        return {
          type: 'mysql',
          host: config.get('mysql_host'),
          port: +config.get('mysql_port'),
          username: config.get('mysql_user'),
          password: config.get('mysql_pwd'),
          database: config.get('mysql_db'),
          synchronize: true,
          logging: true,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          poolSize: 10,
          connectorPackage: 'mysql2',
        } as TypeOrmModuleOptions;
      },
      inject: [ConfigService],
    }),
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
