import { useRef } from 'react'
import type { Staff } from '@/types'
import { INIT_DEPTS } from '@/lib/constants'
import { useShiftStore } from '@/store/useShiftStore'
import { StaffTimeBlockManager } from './StaffTimeBlockManager'
import { StaffPatternPanel } from './StaffPatternPanel'
import { PeriodPatternPanel } from './PeriodPatternPanel'

const SEL: React.CSSProperties = {
  border: '1.5px solid #dde3ef', borderRadius: 6, padding: '3px 8px',
  fontSize: 12, outline: 'none', background: '#f8faff', cursor: 'pointer',
  fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
}

type SectionTab = 'timeblocks' | 'patterns' | 'periodpatterns'

interface Props {
  s: Staff
  isOpen: boolean
  sectionTab: SectionTab
  onToggle: () => void
  onSectionChange: (tab: SectionTab) => void
  dragStaffId: React.MutableRefObject<number | null>
}

export function StaffCard({ s, isOpen, sectionTab, onToggle, onSectionChange, dragStaffId }: Props) {
  const { updateStaff, moveStaff, handleDrop, setDragOverId, dragOverId, setStaff, staff } = useShiftStore()

  return (
    <div
      className="staff-card"
      draggable
      onDragStart={() => { dragStaffId.current = s.id }}
      onDragOver={e => { e.preventDefault(); setDragOverId(s.id) }}
      onDragLeave={() => setDragOverId(null)}
      onDrop={() => { if (dragStaffId.current) handleDrop(s.id, dragStaffId.current); dragStaffId.current = null }}
      style={{
        opacity: dragStaffId.current === s.id ? 0.4 : 1,
        outline: dragOverId === s.id ? '2px dashed #c9a84c' : 'none',
        outlineOffset: 2, transition: 'outline .1s',
      }}
    >
      {/* Header */}
      <div
        className={`staff-card-hdr${isOpen ? ' open' : ''}`}
        onClick={onToggle}
      >
        <span style={{ fontSize: 10, color: isOpen ? 'rgba(255,255,255,.4)' : '#94a3b8', minWidth: 16 }}>{s.no}</span>
        <span style={{ fontSize: 14, fontWeight: 700, textDecoration: !s.active ? 'line-through' : 'none' }}>{s.name}</span>
        {!s.active && <span style={{ fontSize: 9, color: '#ef4444', background: '#fee2e2', padding: '1px 5px', borderRadius: 3 }}>退職</span>}
        {s.timeBlocks.length > 0 && <span style={{ fontSize: 9.5, color: isOpen ? 'rgba(255,255,255,.7)' : '#0f766e', background: isOpen ? 'rgba(255,255,255,.1)' : '#ccfbf1', padding: '1px 6px', borderRadius: 5 }}>⏱ {s.timeBlocks.length}個人</span>}
        {s.patterns.length > 0 && <span style={{ fontSize: 9.5, color: isOpen ? 'rgba(255,255,255,.7)' : '#6d28d9', background: isOpen ? 'rgba(255,255,255,.1)' : '#ede9fe', padding: '1px 6px', borderRadius: 5 }}>📅 {s.patterns.length}パターン</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 3, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
          <span style={{ fontSize: 14, color: isOpen ? 'rgba(255,255,255,.5)' : '#cbd5e1', cursor: 'grab', padding: '0 4px', userSelect: 'none' }} title="ドラッグで並び替え">⠿</span>
          <button onClick={() => moveStaff(s.id, -1)} style={{ background: isOpen ? 'rgba(255,255,255,.2)' : '#e8ecf5', border: 'none', borderRadius: 4, width: 22, height: 22, cursor: 'pointer', fontSize: 12, color: isOpen ? '#fff' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>↑</button>
          <button onClick={() => moveStaff(s.id, 1)} style={{ background: isOpen ? 'rgba(255,255,255,.2)' : '#e8ecf5', border: 'none', borderRadius: 4, width: 22, height: 22, cursor: 'pointer', fontSize: 12, color: isOpen ? '#fff' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>↓</button>
          <span style={{ fontSize: 11, opacity: .4, marginLeft: 4 }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded content */}
      {isOpen && (
        <div>
          {/* Meta */}
          <div style={{ padding: '10px 16px', background: '#f8faff', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>名前</label>
              <input value={s.name} onChange={e => updateStaff(s.id, p => ({ ...p, name: e.target.value }))}
                style={{ border: '1.5px solid #dde3ef', borderRadius: 6, padding: '5px 10px', fontSize: 13, outline: 'none', background: '#fff', fontFamily: "'Noto Sans JP',sans-serif", width: 130 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>部署</label>
              <select value={s.deptId} onChange={e => updateStaff(s.id, p => ({ ...p, deptId: e.target.value as typeof s.deptId }))} style={{ ...SEL, fontSize: 13, padding: '5px 10px' }}>
                {INIT_DEPTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>退職日</label>
              <input type="date" value={s.leaveDate || ''} onChange={e => updateStaff(s.id, p => ({ ...p, leaveDate: e.target.value, active: !e.target.value }))}
                style={{ ...SEL, padding: '4px 8px', fontSize: 12 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <label style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>在職</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12 }}>
                <input type="checkbox" checked={s.active} onChange={e => updateStaff(s.id, p => ({ ...p, active: e.target.checked, leaveDate: e.target.checked ? '' : p.leaveDate }))} style={{ cursor: 'pointer' }} />
                在職中
              </label>
            </div>
            <button
              onClick={() => {
                const deptId = s.deptId
                const filtered = staff.filter(x => x.id !== s.id)
                let no = 1
                const renumbered = filtered.map(x =>
                  x.deptId === deptId ? { ...x, no: no++ } : x
                )
                setStaff(renumbered)
              }}
              className="btn danger sm"
              style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}
            >削除</button>
          </div>

          {/* Section tabs */}
          <div style={{ padding: '10px 16px 0', background: '#fff' }}>
            <div className="sec-tabs">
              {([
                ['timeblocks', '⏱ 個人時間テンプレート', s.timeBlocks.length],
                ['patterns', '📅 週間パターン', s.patterns.length],
                ['periodpatterns', '🗓 期間限定パターン', (s.periodPatterns || []).length],
              ] as const).map(([key, label, count]) => (
                <button
                  key={key}
                  className={`sec-tab${sectionTab === key ? ' on' : ''}`}
                  onClick={() => onSectionChange(key)}
                  style={key === 'periodpatterns' && sectionTab === key ? { background: '#c9a84c', color: '#0f2044' } : undefined}
                >
                  {label} {count > 0 && <span style={{ background: 'rgba(255,255,255,.25)', borderRadius: 10, padding: '0 5px', fontSize: 10 }}>{count}</span>}
                </button>
              ))}
            </div>
          </div>

          {sectionTab === 'timeblocks' && <StaffTimeBlockManager s={s} />}
          {sectionTab === 'patterns' && <StaffPatternPanel s={s} />}
          {sectionTab === 'periodpatterns' && <PeriodPatternPanel s={s} />}
        </div>
      )}
    </div>
  )
}
