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
    showPrint, showManual,
    setShowPrint, setShowManual,
  } = useShiftStore()

  // Load data on mount
  useEffect(() => {
    loadFromDb()
  }, [])

  // Debounced auto-save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveToDb()
    }, 1200)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [staff, globalTemplates, cellData])

  return (
    <div style={{ fontFamily: "'Noto Sans JP',sans-serif", minHeight: '100vh', background: '#f1f5f9', color: '#1e293b' }}>
      <AppHeader />

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
