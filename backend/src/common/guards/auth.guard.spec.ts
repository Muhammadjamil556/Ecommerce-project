import { Controller, ExecutionContext, Get } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { Public } from '../decorators/public.decorator.js';
import { AuthGuard } from './auth.guard.js';

@Controller()
class ExampleController {
  @Get()
  protectedRoute() {}

  @Public()
  @Get()
  publicRoute() {}
}

function createContext(
  route: 'protectedRoute' | 'publicRoute',
  request: { headers: { authorization?: string }; user?: unknown },
) {
  return {
    getHandler: () => ExampleController.prototype[route],
    getClass: () => ExampleController,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  const verifyAccessToken = vi.fn();
  const guard = new AuthGuard(new Reflector(), {
    verifyAccessToken,
  } as unknown as SupabaseService);

  beforeEach(() => verifyAccessToken.mockReset());

  it('lets anyone use a public route', async () => {
    const context = createContext('publicRoute', { headers: {} });
    expect(await guard.canActivate(context)).toBe(true);
    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  it('attaches the verified user to the request', async () => {
    const user = { id: '1', email: 'a@example.com', accessToken: 'token' };
    verifyAccessToken.mockResolvedValue(user);
    const request = { headers: { authorization: 'Bearer token' } };

    await guard.canActivate(createContext('protectedRoute', request));

    expect(verifyAccessToken).toHaveBeenCalledWith('token');
    expect(request).toHaveProperty('user', user);
  });

  it('rejects a missing token', async () => {
    const context = createContext('protectedRoute', { headers: {} });
    await expect(guard.canActivate(context)).rejects.toThrow('Please log in.');
  });
});
