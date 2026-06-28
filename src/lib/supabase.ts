import {createClient} from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function buildClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Missing Supabase environment variables.\n' +
        `VITE_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}\n` +
        `VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✓' : '✗'}\n` +
        'Running in limited mode — auth and data features are unavailable.'
    );
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  });
}

export const supabase = buildClient();
