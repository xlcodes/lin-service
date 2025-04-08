import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import setupAll from '@/setupAll';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get(ConfigService);
  const port = config.get('app_service_port') || 3000;
  const docsPrefix = config.get('app_docs_prefix') || '';

  await setupAll(app);

  await app.listen(port, () => {
    console.log(`林间有风的服务已经成功运行在 ${port} 端口！`);
    console.log(`当前运行环境：${process.env.NODE_ENV}`);
    console.log(`访问地址：http://localhost:${port}`);
    console.log(`swagger文档地址：http://localhost:${port}/${docsPrefix}`);
  });
}

bootstrap().then(() => {});
