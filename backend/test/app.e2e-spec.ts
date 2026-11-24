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
import { Public } from '../src/common/decorators/public.decorator.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/config/configure-app.js';
import { SupabaseService } from '../src/supabase/supabase.service.js';

class ExampleDto {
  @IsString()
  name: string;
}

// Routes that exist only in this test, to exercise the global error handling.
@Public()
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

// Replaces the real database. test/database.db-spec.ts covers the real one.
const query = {
  select: () => query,
  limit: () => query,
  abortSignal: () => Promise.resolve({ error: null }),
};
const fakeSupabase = { asSystem: () => ({ from: () => query }) };

@Module({ imports: [AppModule], controllers: [TestOnlyController] })
class TestAppModule {}

describe('Application (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(fakeSupabase)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
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
        database: 'up',
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

  it.each([
    ['no header', undefined],
    ['another scheme', 'Basic abc'],
    ['an empty token', 'Bearer '],
  ])('requires login when there is %s', async (_name, authorization) => {
    const call = request(app.getHttpServer()).get('/api/v1/users/me');
    if (authorization) call.set('Authorization', authorization);
    const response = await call.expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
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
