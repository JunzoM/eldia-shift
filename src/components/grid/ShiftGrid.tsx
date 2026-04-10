import { useMemo } from 'react'
import { useShiftStore } from '@/store/useShiftStore'
import { INIT_DEPTS } from '@/lib/constants'
import { getDays, getWeekDates } from '@/lib/utils'
import { ShiftTable } from './ShiftTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

export function ShiftGrid() {
  const {
    viewMode, weekStart, year, month,
    showInactive, setShowInactive,
    setView, setSettingsTab, setAddingStaff,
    addingStaff, newStaff, setNewStaff, addStaff,
    setShowPrint,
  } = useShiftStore()

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const monthDates = useMemo(() =>
    Array.from({ length: getDays(year, month) }, (_, i) => new Date(year, month, i + 1)),
    [year, month]
  )
  const dates = viewMode === 'weekly' ? weekDates : monthDates

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { setView('settings'); setSettingsTab('staff'); setAddingStaff(true) }}
        >
          ＋ スタッフ
        </Button>
        <Button
          variant="gold"
          size="sm"
          onClick={() => setShowPrint(true)}
        >
          🖨 印刷 / PDF
        </Button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', cursor: 'pointer', marginLeft: 4 }}>
          <Checkbox
            checked={showInactive}
            onCheckedChange={v => setShowInactive(!!v)}
          />
          退職者も表示
        </label>
        <div style={{ marginLeft: 'auto', fontSize: 10.5, color: '#94a3b8' }}>
          🟡 パターン自動入力　　クリックでシフト選択
        </div>
      </div>

      {/* Grid */}
      <div className="grid-wrap">
        <ShiftTable dates={dates} viewMode={viewMode} />
      </div>

      {/* Add staff form */}
      {addingStaff && (
        <div style={{
          background: '#fff', borderRadius: 9, border: '1.5px dashed #dde3ef',
          padding: '12px 14px', marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <Input
            placeholder="氏名 *"
            value={newStaff.name}
            onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && addStaff()}
            autoFocus
            style={{ width: 130 }}
          />
          <select
            value={newStaff.deptId}
            onChange={e => setNewStaff({ ...newStaff, deptId: e.target.value as typeof newStaff.deptId })}
            style={{ border: '1.5px solid #dde3ef', borderRadius: 6, padding: '5px 10px', fontSize: 13, outline: 'none', background: '#f8faff', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}
          >
            {INIT_DEPTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
          <Button variant="gold" size="sm" onClick={addStaff}>追加</Button>
          <Button variant="secondary" size="sm" onClick={() => setAddingStaff(false)}>キャンセル</Button>
        </div>
      )}
    </>
  )
}
