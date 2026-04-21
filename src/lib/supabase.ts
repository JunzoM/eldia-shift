import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  ?? 'https://yaslfksvlvdqlkjrnlfr.supabase.co'

const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc2xma3N2bHZkcWxranJubGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIxMTAsImV4cCI6MjA4OTQ0ODExMH0.1BJktZH4GwsuRzmPyTL1w1GBxhVUtGyun12rwpKBN9U'

export const sbClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function dbLoad(key: string): Promise<unknown | null> {
  if (!sbClient) return null
  try {
    const { data, error } = await sbClient
      .from('shift_store')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    if (error) throw error
    return data ? data.value : null
  } catch (e) {
    console.error('dbLoad exception:', e)
    return null
  }
}

export async function dbSave(key: string, value: unknown): Promise<void> {
  if (!sbClient) return
  try {
    const { error } = await sbClient.from('shift_store').upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    )
    if (error) throw error
  } catch (e) {
    console.error('dbSave exception:', e)
  }
}
