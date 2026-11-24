import { Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service.js';
import { HealthService } from './health.service.js';

function createService(result: { error: { message: string } | null }) {
  const query = {
    select: () => query,
    limit: () => query,
    abortSignal: () => Promise.resolve(result),
  };
  const supabase = { asSystem: () => ({ from: () => query }) };
  return new HealthService(supabase as unknown as SupabaseService);
}

describe('HealthService', () => {
  it('reports ok when the database responds', async () => {
    const health = await createService({ error: null }).getHealth();
    expect(health).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('reports degraded and logs the reason when the database fails', async () => {
    const logError = vi.spyOn(Logger.prototype, 'error').mockReturnValue();

    const health = await createService({
      error: { message: 'connection lost' },
    }).getHealth();

    expect(health).toMatchObject({ status: 'degraded', database: 'down' });
    expect(logError).toHaveBeenCalledWith(
      'Database check failed: connection lost',
    );
  });
});
