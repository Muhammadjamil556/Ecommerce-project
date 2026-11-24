import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { configureApp } from './config/configure-app.js';
import { EnvironmentVariables } from './config/env.validation.js';
import { SWAGGER_PATH, setupSwagger } from './config/swagger.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config: ConfigService<EnvironmentVariables, true> =
    app.get(ConfigService);

  configureApp(app);

  const isProduction = config.get('NODE_ENV', { infer: true }) === 'production';
  if (!isProduction) {
    setupSwagger(app);
  }

  const port = config.get('PORT', { infer: true });
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`API running at http://localhost:${port}/api/v1`);
  if (!isProduction) {
    logger.log(`Swagger docs at http://localhost:${port}/${SWAGGER_PATH}`);
  }
}
await bootstrap();
