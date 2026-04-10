import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yaslfksvlvdqlkjrnlfr.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc2xma3N2bHZkcWxranJubGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIxMTAsImV4cCI6MjA4OTQ0ODExMH0.1BJktZH4GwsuRzmPyTL1w1GBxhVUtGyun12rwpKBN9U'

export const sbClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function dbLoad<T>(key: string): Promise<T | null> {
  try {
    const { data, error } = await sbClient
      .from('shift_store')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    if (error) { console.error('dbLoad error:', error.message); throw error }
    return data ? (data.value as T) : null
  } catch (e) {
    console.error('dbLoad exception:', e)
    return null
  }
}

export async function dbSave(key: string, value: unknown): Promise<void> {
  try {
    const { error } = await sbClient.from('shift_store').upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    if (error) {
      console.error('dbSave error:', error.message)
      alert('保存エラー: ' + error.message)
    }
  } catch (e) {
    console.error('dbSave exception:', e)
    alert('保存例外: ' + (e as Error).message)
  }
}
