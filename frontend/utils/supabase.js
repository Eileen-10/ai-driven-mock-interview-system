import { createClient } from "@supabase/supabase-js";

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// export const supabase = createClient(supabaseURL, supabaseKEY);
export const createSupabaseClientWithToken = (token) => {
    return createClient(supabaseURL, supabaseKEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  };
