import { createClient } from '@supabase/supabase-js';

/**
 * Admin client for server-side operations like inviting users
 * This uses the service role key and should NEVER be exposed to the client
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase admin credentials. Set SUPABASE_SERVICE_ROLE_KEY in environment.');
    throw new Error('Supabase admin client not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
