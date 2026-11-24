import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from './env.validation.js';

/** Settings shared by the real server and the end-to-end tests. */
export function configureApp(app: INestApplication): void {
  const config: ConfigService<EnvironmentVariables, true> =
    app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: config.get('FRONTEND_URL', { infer: true }) });
  app.enableShutdownHooks();
}
