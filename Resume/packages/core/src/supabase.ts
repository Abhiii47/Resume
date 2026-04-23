import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getEnvVar(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`[Supabase Config] Missing environment variable: ${name}`);
  }
  return value;
}

// Lazy initialization functions
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Returns a standard Supabase client with the Anon key.
 * Used for authenticated user requests.
 */
export function getSupabase() {
  if (!supabaseInstance) {
    const url = getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
    const anonKey = getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    if (url.includes("placeholder")) {
      throw new Error("[Supabase] Invalid URL: Placeholder detected.");
    }

    supabaseInstance = createClient(url, anonKey);
  }
  return supabaseInstance;
}

/**
 * Returns a privileged Supabase client with the Service Role key.
 * !!! ONLY FOR SERVER-SIDE USE !!!
 */
export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const url = getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = getEnvVar("SUPABASE_SERVICE_ROLE_KEY");

    if (url.includes("placeholder")) {
      throw new Error("[Supabase Admin] Invalid URL: Placeholder detected.");
    }

    supabaseAdminInstance = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdminInstance;
}

// Backwards compatibility (optional, but functional if called during request)
export const supabase = getSupabase;
export const supabaseAdmin = getSupabaseAdmin;

/**
 * Resets the lazy-initialized Supabase instances.
 * ONLY FOR TESTING PURPOSES.
 */
export function _resetSupabaseClients() {
  supabaseInstance = null;
  supabaseAdminInstance = null;
}
