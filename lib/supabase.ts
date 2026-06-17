import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
  global: {
    fetch: (url, options) => {
      const controller = new AbortController();
      // Увеличили таймаут до 15 секунд
      const timeout = setTimeout(() => controller.abort(), 15000);

      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
    },
  },
});