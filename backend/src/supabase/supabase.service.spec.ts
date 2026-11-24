import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../config/env.validation.js';
import { SupabaseService } from './supabase.service.js';

describe('SupabaseService', () => {
  const fetchMock = vi.fn<typeof fetch>();
  let service: SupabaseService;

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => Response.json([]));
    vi.stubGlobal('fetch', fetchMock);

    const config = new ConfigService<EnvironmentVariables, true>({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      SUPABASE_SECRET_KEY: 'sb_secret_test',
    });
    service = new SupabaseService(config);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function sentHeaders(call: number): Headers {
    return new Headers(fetchMock.mock.calls[call][1]?.headers);
  }

  it('sends the user token with the publishable key', async () => {
    await service.forUser('user-token').from('profiles').select();

    expect(sentHeaders(0).get('apikey')).toBe('sb_publishable_test');
    expect(sentHeaders(0).get('authorization')).toBe('Bearer user-token');
  });

  it('keeps users separate', async () => {
    const first = service.forUser('first-token');
    const second = service.forUser('second-token');
    await second.from('profiles').select();
    await first.from('profiles').select();

    expect(sentHeaders(0).get('authorization')).toBe('Bearer second-token');
    expect(sentHeaders(1).get('authorization')).toBe('Bearer first-token');
  });

  it('uses the secret key for system work', async () => {
    await service.asSystem().from('profiles').select();

    expect(sentHeaders(0).get('apikey')).toBe('sb_secret_test');
  });
});
