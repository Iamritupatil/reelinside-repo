import { createClient } from "@supabase/supabase-js"

let _client: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowser() {
  if (typeof window === "undefined") return null
  if (!_client) {
    // Strip whitespace and BOM characters that cause "non ISO-8859-1 code point" header errors
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/^﻿/, "").trim()
    const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "").replace(/^﻿/, "").trim()
    if (!url || !key) return null
    _client = createClient(url, key, { auth: { persistSession: false } })
  }
  return _client
}
