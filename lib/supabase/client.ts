import { createClient } from "@supabase/supabase-js"

/**
 * Browser Supabase client (PUBLIC anon key).
 *
 * RLS governs everything it can do: it may INSERT into `waitlist` and call the
 * `waitlist_count()` function — nothing else. It cannot read, edit, or delete
 * any row, even though the anon key is visible in the frontend.
 */
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: { persistSession: false },
  },
)
