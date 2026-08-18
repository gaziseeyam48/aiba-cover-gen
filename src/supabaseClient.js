import { createClient } from '@supabase/supabase-js';

const isProduction = window.location.hostname.includes('gaziseeyam.info');

// In production, route requests through your custom domain proxy
const supabaseUrl = isProduction
    ? window.location.origin
    : import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});