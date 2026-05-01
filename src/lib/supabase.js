import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Browser Client (Anon Key)
 * ────────────────────────────────────
 * Digunakan oleh frontend React di browser.
 * Gunakan VITE_SUPABASE_* env vars (dibaca via import.meta.env).
 * Jangan pernah gunakan service role key di sini.
 */
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
