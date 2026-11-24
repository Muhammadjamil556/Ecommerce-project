import { randomUUID } from 'node:crypto';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { validateEnv } from '../src/config/env.validation.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Database tests must not run against production.');
}

const env = validateEnv(process.env);
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const PERMISSION_DENIED = '42501';

/** Calls Supabase directly, as an attacker with only the public key would. */
function createPublicClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, options);
}

describe('Database security', () => {
  const system = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    options,
  );
  const createdUserIds: string[] = [];
  let ann: { id: string; client: SupabaseClient };
  let bob: { id: string; client: SupabaseClient };

  async function createUser(fullName: string) {
    const email = `db-test-${randomUUID()}@example.com`;
    const password = randomUUID();
    const created = await system.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'admin' },
    });
    if (created.error) throw created.error;
    createdUserIds.push(created.data.user.id);

    const client = createPublicClient();
    const login = await client.auth.signInWithPassword({ email, password });
    if (login.error) throw login.error;

    return { id: created.data.user.id, client };
  }

  beforeAll(async () => {
    ann = await createUser('Ann');
    bob = await createUser('Bob');
  });

  afterAll(async () => {
    const results = await Promise.all(
      createdUserIds.map((id) => system.auth.admin.deleteUser(id)),
    );
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;
  });

  it('creates a profile and a customer role on sign-up', async () => {
    const profile = await ann.client.from('profiles').select().single();
    const role = await ann.client.from('user_roles').select().single();

    expect(profile.data).toMatchObject({ id: ann.id, full_name: 'Ann' });
    // The sign-up metadata asked for "admin" and must be ignored.
    expect(role.data).toMatchObject({ user_id: ann.id, role: 'customer' });
  });

  it('hides other users', async () => {
    const profiles = await ann.client
      .from('profiles')
      .select()
      .eq('id', bob.id);
    const roles = await ann.client
      .from('user_roles')
      .select()
      .eq('user_id', bob.id);

    expect(profiles).toMatchObject({ error: null, data: [] });
    expect(roles).toMatchObject({ error: null, data: [] });
  });

  it('allows editing only your own profile', async () => {
    const own = await ann.client
      .from('profiles')
      .update({ full_name: 'Ann Updated' })
      .eq('id', ann.id)
      .select();
    const other = await ann.client
      .from('profiles')
      .update({ full_name: 'Hacked' })
      .eq('id', bob.id)
      .select();

    expect(own.data).toHaveLength(1);
    expect(other).toMatchObject({ error: null, data: [] });
  });

  it('prevents changing protected profile columns', async () => {
    const { error } = await ann.client
      .from('profiles')
      .update({ created_at: '2000-01-01' })
      .eq('id', ann.id);

    expect(error?.code).toBe(PERMISSION_DENIED);
  });

  it('prevents changing your own role', async () => {
    const update = await ann.client
      .from('user_roles')
      .update({ role: 'admin' })
      .eq('user_id', ann.id);
    const upsert = await ann.client
      .from('user_roles')
      .upsert({ user_id: ann.id, role: 'admin' });
    const remove = await ann.client
      .from('user_roles')
      .delete()
      .eq('user_id', ann.id);

    expect(update.error?.code).toBe(PERMISSION_DENIED);
    expect(upsert.error?.code).toBe(PERMISSION_DENIED);
    expect(remove.error?.code).toBe(PERMISSION_DENIED);
  });

  it.each(['profiles', 'user_roles'])(
    'blocks visitors who are not logged in from %s',
    async (table) => {
      const { error } = await createPublicClient().from(table).select();
      expect(error?.code).toBe(PERMISSION_DENIED);
    },
  );

  it('lets the backend system client read every user', async () => {
    const { data, error } = await system
      .from('user_roles')
      .select()
      .in('user_id', [ann.id, bob.id]);

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
  });
});
