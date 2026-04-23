import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { getSupabase, getSupabaseAdmin, _resetSupabaseClients } from './supabase.ts';

// We will mock the process.env and provide a way to check if createClient was called.
// Since we can't easily mock the external module, we'll rely on the fact that
// it will fail if called with invalid arguments, or we can use a more clever way.

describe('Supabase Clients', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env
    for (const key in process.env) {
      delete process.env[key];
    }
    Object.assign(process.env, originalEnv);

    _resetSupabaseClients();
  });

  describe('getSupabase', () => {
    it('should throw if NEXT_PUBLIC_SUPABASE_URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      assert.throws(() => getSupabase(), /Missing environment variable: NEXT_PUBLIC_SUPABASE_URL/);
    });

    it('should throw if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      assert.throws(() => getSupabase(), /Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY/);
    });

    it('should throw if URL contains placeholder', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      assert.throws(() => getSupabase(), /Invalid URL: Placeholder detected/);
    });

    it('should create and return a singleton instance', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const client1 = getSupabase();
      const client2 = getSupabase();

      assert.ok(client1);
      assert.strictEqual(client1, client2);
    });
  });

  describe('getSupabaseAdmin', () => {
    it('should throw if SUPABASE_SERVICE_ROLE_KEY is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      assert.throws(() => getSupabaseAdmin(), /Missing environment variable: SUPABASE_SERVICE_ROLE_KEY/);
    });

    it('should throw if URL contains placeholder (admin)', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      assert.throws(() => getSupabaseAdmin(), /Invalid URL: Placeholder detected/);
    });

    it('should create and return a singleton admin instance', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const client1 = getSupabaseAdmin();
      const client2 = getSupabaseAdmin();

      assert.ok(client1);
      assert.strictEqual(client1, client2);
    });
  });
});
