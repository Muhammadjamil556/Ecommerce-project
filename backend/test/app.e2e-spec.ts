import {
  Body,
  Controller,
  Get,
  INestApplication,
  Module,
  Post,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsString } from 'class-validator';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/config/configure-app.js';

class ExampleDto {
  @IsString()
  name: string;
}

// Routes that exist only in this test, to exercise the global error handling.
@Controller('test-only')
class TestOnlyController {
  @Get('crash')
  crash() {
    throw new Error('secret database detail');
  }

  @Post('validate')
  validate(@Body() body: ExampleDto) {
    return body;
  }
}

@Module({ imports: [AppModule], controllers: [TestOnlyController] })
class TestAppModule {}

describe('Application (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAppModule],
    })
      .setLogger(false)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns health inside the data envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body).toEqual({
      data: {
        status: 'ok',
        uptimeSeconds: expect.any(Number),
        timestamp: expect.any(String),
      },
    });
  });

  it('allows the configured frontend origin only', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('Origin', 'http://evil.example');

    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
  });

  it('returns the error format for an unknown route', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/missing')
      .expect(404);

    expect(response.body.error).toMatchObject({
      code: 'NOT_FOUND',
      details: [],
    });
  });

  it('lists each validation problem and rejects unknown fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/test-only/validate')
      .send({ role: 'admin' })
      .expect(400);

    expect(response.body.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: ['property role should not exist', 'name must be a string'],
    });
  });

  it('returns 400 for malformed JSON', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/test-only/validate')
      .set('Content-Type', 'application/json')
      .send('{"name":')
      .expect(400);

    expect(response.body.error.code).toBe('BAD_REQUEST');
  });

  it('returns 413 for an oversized body', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/test-only/validate')
      .send({ name: 'x'.repeat(200_000) })
      .expect(413);

    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('hides internal error details', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/test-only/crash')
      .expect(500);

    expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(JSON.stringify(response.body)).not.toContain('secret');
  });
});
