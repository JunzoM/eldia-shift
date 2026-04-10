import { useEffect, useRef } from 'react'
import { useShiftStore } from '@/store/useShiftStore'
import { AppHeader } from '@/components/layout/AppHeader'
import { ShiftGrid } from '@/components/grid/ShiftGrid'
import { SummaryView } from '@/components/summary/SummaryView'
import { SettingsView } from '@/components/settings/SettingsView'
import { PrintModal } from '@/components/print/PrintModal'
import { ManualModal } from '@/components/manual/ManualModal'

export default function App() {
  const {
    view, loadFromDb, saveToDb,
    staff, globalTemplates, cellData,
    dbStatus,
    showPrint, showManual,
    setShowPrint, setShowManual,
  } = useShiftStore()

  // Guard: don't save until initial DB load completes
  const hasLoaded = useRef(false)

  // Load data on mount
  useEffect(() => {
    loadFromDb().then(() => { hasLoaded.current = true })
  }, [])

  // Debounced auto-save — skipped until first load succeeds
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!hasLoaded.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveToDb()
    }, 1200)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [staff, globalTemplates, cellData])

  const isLoading = dbStatus === 'loading' || dbStatus === 'init'

  return (
    <div style={{ fontFamily: "'Noto Sans JP',sans-serif", minHeight: '100vh', background: '#f1f5f9', color: '#1e293b' }}>
      <AppHeader />

      {/* Loading overlay */}
      {isLoading && (
        <div style={{
          position: 'fixed', inset: 0, top: 52, zIndex: 500,
          background: 'rgba(241,245,249,.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(2px)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 12, animation: 'spin 1s linear infinite' }}>⏳</div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>データを読み込み中...</div>
          </div>
        </div>
      )}

      <main style={{ padding: '14px 16px' }}>
        {view === 'grid' && <ShiftGrid />}
        {view === 'summary' && <SummaryView />}
        {view === 'settings' && <SettingsView />}
      </main>

      {showPrint && <PrintModal onClose={() => setShowPrint(false)} />}
      {showManual && <ManualModal onClose={() => setShowManual(false)} />}
    </div>
  )
}
