import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Admin Supabase client (bypasses RLS). Null when not configured → guest mode. */
export const supabase: SupabaseClient | null =
  url && serviceKey ? createClient(url, serviceKey) : null;
