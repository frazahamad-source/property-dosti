import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isValidUrl = (url: string | undefined): boolean => {
    try {
        return !!url && new URL(url).protocol.startsWith('http');
    } catch {
        return false;
    }
};

if (!isValidUrl(supabaseUrl) || !supabaseAnonKey) {
    console.warn('Supabase credentials missing or invalid. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

// Fallback to a valid URL format to prevent build-time crashes if env vars are missing
const urlToUse = isValidUrl(supabaseUrl) ? supabaseUrl! : 'https://example.supabase.co';
const keyToUse = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(urlToUse, keyToUse);
