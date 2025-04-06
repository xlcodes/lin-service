import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import setupAll from '@/setupAll';
import * as process from 'node:process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const port = config.get('app_service_port') || 3000;
  const docsPrefix = config.get('app_docs_prefix') || '';

  console.log(process.env.NODE_ENV);

  await setupAll(app);

  await app.listen(port, () => {
    console.log(`林间有风的服务已经成功运行在 ${port} 端口！`);
    console.log(`访问地址：http://localhost:${port}`);
    console.log(`swagger文档地址：http://localhost:${port}/${docsPrefix}`);
  });
}

bootstrap().then(() => {});
