import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../modules/users/users.service.js';
import { Roles } from '../decorators/roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

class ExampleController {
  openRoute() {}

  @Roles('admin')
  adminRoute() {}
}

function createContext(
  route: 'openRoute' | 'adminRoute',
  user?: { id: string },
) {
  return {
    getHandler: () => ExampleController.prototype[route],
    getClass: () => ExampleController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const getRole = vi.fn();
  const guard = new RolesGuard(new Reflector(), {
    getRole,
  } as unknown as UsersService);
  const user = { id: '1' };

  it('ignores routes without required roles', async () => {
    expect(await guard.canActivate(createContext('openRoute', user))).toBe(
      true,
    );
  });

  it('allows the required role', async () => {
    getRole.mockResolvedValue('admin');
    expect(await guard.canActivate(createContext('adminRoute', user))).toBe(
      true,
    );
  });

  it('rejects another role', async () => {
    getRole.mockResolvedValue('customer');
    await expect(
      guard.canActivate(createContext('adminRoute', user)),
    ).rejects.toThrow('You do not have access');
  });

  it('rejects a request without a user', async () => {
    await expect(
      guard.canActivate(createContext('adminRoute')),
    ).rejects.toThrow('Please log in.');
  });
});
