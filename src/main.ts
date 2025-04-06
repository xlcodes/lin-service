import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const port = config.get('app_service_port') || 3000;

  await app.listen(port, () => {
    console.log(`林间有风的服务已经成功运行在 ${port} 端口！`);
    console.log(`访问地址：http://localhost:${port}`);
  });
}

bootstrap().then(() => {});
