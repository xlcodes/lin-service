import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { RedisModule } from './core/redis/redis.module';
import { utilities, WinstonModule } from 'nest-winston';
import { transports, format } from 'winston';
import { UserModule } from './modules/user/user.module';
import { CaptchaModule } from './core/captcha/captcha.module';
import 'winston-daily-rotate-file';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { LoginGuard } from '@/core/guards/login.guard';
import { BillModule } from './modules/bill/bill.module';
import { BillTypeService } from './modules/bill/service/bill-type.service';
import { BillTypeController } from './modules/bill/controller/bill-type.controller';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { BillEntity } from '@/modules/bill/entities/bill.entity';
import { BillTypeEntity } from '@/modules/bill/entities/bill-type.entity';

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
          synchronize: process.env.NODE_ENV === 'development',
          logging: true,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          poolSize: 10,
          connectorPackage: 'mysql2',
        } as TypeOrmModuleOptions;
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([UserEntity, BillEntity, BillTypeEntity]),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory(config: ConfigService) {
        return {
          secret: config.get('jwt_secret'),
          signOptions: {
            expiresIn: config.get('jwt_expires_in'),
          },
        } as JwtModuleOptions;
      },
    }),
    // 日志集成
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        level: 'debug',
        transports: [
          new transports.DailyRotateFile({
            level: configService.get('winston_logger_level'),
            dirname: configService.get('winston_logger_dirname'),
            filename: configService.get('winston_logger_filename'),
            datePattern: configService.get('winston_logger_date_pattern'),
            maxSize: configService.get('winston_logger_max_size'),
          }),
          new transports.Console({
            format: format.combine(
              format.timestamp(),
              utilities.format.nestLike(),
            ),
          }),
        ],
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    UserModule,
    CaptchaModule,
    BillModule,
  ],
  controllers: [AppController, BillTypeController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: LoginGuard,
    },
    BillTypeService,
  ],
})
export class AppModule {}
