import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionsFilter } from '@/core/filters/http-exceptions-filter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

const createDocument = (app: INestApplication) => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const config = app.get(ConfigService);
  const documentConfig = new DocumentBuilder()
    .setTitle('林间有风')
    .setDescription('api 接口文档')
    .setVersion('1.0.0')
    .build();

  const docsPrefix = config.get('app_docs_prefix');

  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup(docsPrefix, app, document);
};

const setupAll = async (app: INestApplication) => {
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionsFilter());

  // 集成swagger文档
  createDocument(app);

  // 使用自定义日志
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
};

export default setupAll;
