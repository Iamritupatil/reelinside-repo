import { createClient } from "@supabase/supabase-js"

// Lazy singleton — only created in the browser so SSR never crashes
// even when NEXT_PUBLIC_ vars aren't set at build time.
let _client: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowser() {
  if (typeof window === "undefined") return null
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false } },
    )
  }
  return _client
}
