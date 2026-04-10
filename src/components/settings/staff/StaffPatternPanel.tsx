import { useState, useMemo } from 'react'
import type { Staff, TimeBlock, WeeklyPattern } from '@/types'
import { useShiftStore } from '@/store/useShiftStore'
import { PALETTE, OFF_BLOCKS, JP_WD } from '@/lib/constants'
import { uid, fmtT } from '@/lib/utils'
import { PatternEditor } from '@/components/shared/PatternEditor'

interface Props { s: Staff }

export function StaffPatternPanel({ s }: Props) {
  const { globalTemplates, updateStaff } = useShiftStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  function savePattern(form: WeeklyPattern) {
    updateStaff(s.id, prev => {
      const np = { ...form, id: form.id || uid() }
      const patterns = prev.patterns.find(p => p.id === np.id)
        ? prev.patterns.map(p => p.id === np.id ? np : p)
        : [...prev.patterns, np]
      return { ...prev, patterns, activePatternId: prev.activePatternId || np.id }
    })
    setEditingId(null); setCreating(false)
  }

  function removePattern(pid: string) {
    updateStaff(s.id, prev => {
      const patterns = prev.patterns.filter(p => p.id !== pid)
      return { ...prev, patterns, activePatternId: prev.activePatternId === pid ? (patterns[0]?.id || null) : prev.activePatternId }
    })
  }

  const editPat = editingId ? s.patterns.find(p => p.id === editingId) : null
  const allBlocks = useMemo(() => [...s.timeBlocks, ...globalTemplates, ...OFF_BLOCKS], [s.timeBlocks, globalTemplates])

  return (
    <div style={{ padding: '12px 16px' }}>
      {(creating || editPat) && (
        <PatternEditor
          initial={editPat || null}
          s={s}
          globalTemplates={globalTemplates}
          onSave={savePattern}
          onCancel={() => { setCreating(false); setEditingId(null) }}
        />
      )}
      {s.patterns.length === 0 && !creating && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: 13 }}>週間パターンがありません</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {s.patterns.map(p => {
          const c = PALETTE[p.colorIdx]; const isA = s.activePatternId === p.id
          return (
            <div key={p.id} style={{ border: `1.5px solid ${isA ? c.color : '#e2e8f0'}`, borderRadius: 9, padding: '10px 12px', background: isA ? c.bg : '#fafbff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: isA ? c.color : '#0f2044' }}>{p.label}</span>
                  {isA && <span style={{ fontSize: 10, color: c.color, fontWeight: 700, marginLeft: 8 }}>✓ 適用中</span>}
                  {p.activeFrom && <span style={{ fontSize: 10, color: '#c9a84c', fontWeight: 700, marginLeft: 6, background: '#fffbf0', border: '1px solid #c9a84c', padding: '0 5px', borderRadius: 4 }}>{p.activeFrom}〜</span>}
                  {!p.activeFrom && <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6 }}>デフォルト</span>}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                  {!isA && <button onClick={() => updateStaff(s.id, prev => ({ ...prev, activePatternId: p.id }))} style={{ background: c.bg, color: c.color, border: `1.5px solid ${c.color}`, padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>適用</button>}
                  <button onClick={() => { setEditingId(p.id); setCreating(false) }} style={{ background: '#fff', color: '#0f2044', border: '1.5px solid #dde3ef', padding: '2px 8px', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>編集</button>
                  <button onClick={() => removePattern(p.id)} style={{ background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', padding: '2px 8px', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>削除</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4, 5, 6, 0].map(dow => {
                  const bid = p.days[dow]
                  const b = bid ? allBlocks.find(x => x.id === bid) : null
                  const bc = b ? PALETTE[b.colorIdx] : null
                  return (
                    <div key={dow} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: dow === 0 ? '#dc2626' : dow === 6 ? '#2563eb' : '#64748b' }}>{JP_WD[dow]}</span>
                      {b ? (
                        <div style={{ background: bc!.bg, color: bc!.color, border: `1px solid ${bc!.color}`, borderRadius: 3, padding: '1px 2px', fontSize: 7.5, fontWeight: 700, textAlign: 'center', width: '100%', lineHeight: 1.4 }}>{b.short}</div>
                      ) : <span style={{ fontSize: 9, color: '#e2e8f0' }}>—</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {!creating && !editingId && (
        <button onClick={() => { setCreating(true); setEditingId(null) }} style={{ marginTop: 10, width: '100%', background: '#c9a84c', color: '#0f2044', border: 'none', padding: '7px', borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}>
          ＋ 週間パターンを作成
        </button>
      )}
    </div>
  )
}
