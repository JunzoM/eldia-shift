import { useState, useMemo } from 'react'
import type { Staff, PeriodPattern } from '@/types'
import { useShiftStore } from '@/store/useShiftStore'
import { PALETTE, OFF_BLOCKS, JP_WD } from '@/lib/constants'
import { uid, fmtT } from '@/lib/utils'

interface Props { s: Staff }

const SEL: React.CSSProperties = {
  border: '1.5px solid #dde3ef', borderRadius: 6, padding: '3px 8px',
  fontSize: 12, outline: 'none', background: '#f8faff', cursor: 'pointer',
  fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getDatesInRange(start: string, end: string): string[] {
  if (!start || !end) return []
  const dates: string[] = []
  let cur = parseLocalDate(start)
  const endD = parseLocalDate(end)
  while (cur <= endD) {
    const y = cur.getFullYear(), m = String(cur.getMonth() + 1).padStart(2, '0'), d = String(cur.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export function PeriodPatternPanel({ s }: Props) {
  const { globalTemplates, updateStaff } = useShiftStore()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PeriodPattern>({ id: '', label: '', startDate: '', endDate: '', days: {}, colorIdx: 3 })
  const f = (k: keyof PeriodPattern, v: PeriodPattern[keyof PeriodPattern]) => setForm(p => ({ ...p, [k]: v }))

  const allBlocks = useMemo(() => [...s.timeBlocks, ...globalTemplates, ...OFF_BLOCKS], [s.timeBlocks, globalTemplates])
  const periodPats = s.periodPatterns || []

  function startCreate() {
    setForm({ id: '', label: '', startDate: '', endDate: '', days: {}, colorIdx: 3 })
    setCreating(true); setEditingId(null)
  }
  function startEdit(pp: PeriodPattern) {
    setForm({ ...pp }); setEditingId(pp.id); setCreating(false)
  }
  function removePeriodPat(pid: string) {
    updateStaff(s.id, prev => ({ ...prev, periodPatterns: (prev.periodPatterns || []).filter(p => p.id !== pid) }))
  }

  const rangedDates = getDatesInRange(form.startDate, form.endDate)

  function setDayBlock(dateStr: string, bid: string) {
    setForm(p => ({ ...p, days: { ...p.days, [dateStr]: bid } }))
  }

  function save() {
    if (!form.label.trim() || !form.startDate || !form.endDate) return
    const pp = { ...form, id: form.id || uid() }
    updateStaff(s.id, prev => {
      const arr = prev.periodPatterns || []
      return { ...prev, periodPatterns: editingId ? arr.map(p => p.id === editingId ? pp : p) : [...arr, pp] }
    })
    setCreating(false); setEditingId(null)
  }

  return (
    <div style={{ padding: '12px 16px' }}>
      {(creating || editingId) && (
        <div style={{ background: '#fff', border: '2px solid #c9a84c', borderRadius: 10, padding: 16, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2044', marginBottom: 12 }}>
            {editingId ? '期間パターンを編集' : '新しい期間限定パターン'}
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginLeft: 8 }}>— GW・年末年始など</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>名称</label>
              <input value={form.label} onChange={e => f('label', e.target.value)} placeholder="例：GW・年末年始"
                style={{ border: '1.5px solid #dde3ef', borderRadius: 6, padding: '5px 10px', fontSize: 13, outline: 'none', background: '#f8faff', width: 160, fontFamily: "'Noto Sans JP',sans-serif" }} autoFocus />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>期間</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="date" value={form.startDate} onChange={e => f('startDate', e.target.value)} style={{ ...SEL, padding: '5px 8px', fontSize: 12 }} />
                <span style={{ color: '#94a3b8', fontSize: 12 }}>〜</span>
                <input type="date" value={form.endDate} onChange={e => f('endDate', e.target.value)} style={{ ...SEL, padding: '5px 8px', fontSize: 12 }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>カラー</label>
              <div style={{ display: 'flex', gap: 4, paddingBottom: 5 }}>
                {PALETTE.map((c, i) => <div key={i} onClick={() => f('colorIdx', i)} style={{ width: 18, height: 18, borderRadius: '50%', background: c.color, cursor: 'pointer', border: form.colorIdx === i ? '3px solid #0f2044' : '3px solid transparent' }} />)}
              </div>
            </div>
          </div>

          {rangedDates.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f2044', marginBottom: 8 }}>各日のシフトを設定（{rangedDates.length}日間）</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 220, overflowY: 'auto', padding: '4px 0' }}>
                {rangedDates.map(ds => {
                  const d = parseLocalDate(ds), dow = d.getDay()
                  const isSun = dow === 0, isSat = dow === 6
                  const bid = form.days[ds], b = bid ? allBlocks.find(x => x.id === bid) : null
                  const bc = b ? PALETTE[b.colorIdx] : null
                  return (
                    <div key={ds} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 4px', borderRadius: 7, background: isSun ? '#fff5f5' : isSat ? '#f0f5ff' : '#f8faff', border: `1.5px solid ${bc ? bc.color : isSun ? '#fca5a5' : isSat ? '#93c5fd' : '#e2e8f0'}`, minWidth: 52 }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: isSun ? '#dc2626' : isSat ? '#2563eb' : '#64748b' }}>{d.getMonth() + 1}/{d.getDate()}</span>
                      <span style={{ fontSize: 9, color: isSun ? '#dc2626' : isSat ? '#2563eb' : '#94a3b8' }}>{JP_WD[dow]}</span>
                      <select value={bid || ''} onChange={e => setDayBlock(ds, e.target.value || '')} style={{ fontSize: 9.5, border: `1px solid ${bc ? bc.color : '#dde3ef'}`, borderRadius: 4, padding: '1px 2px', background: bc ? bc.bg : '#fff', color: bc ? bc.color : '#475569', outline: 'none', cursor: 'pointer', maxWidth: 52, fontFamily: "'Noto Sans JP',sans-serif" }}>
                        <option value="">—</option>
                        {s.timeBlocks.length > 0 && <optgroup label="個人">{s.timeBlocks.map(b => <option key={b.id} value={b.id}>{b.short}</option>)}</optgroup>}
                        <optgroup label="共通">{globalTemplates.map(b => <option key={b.id} value={b.id}>{b.short}</option>)}</optgroup>
                        <optgroup label="休日">{OFF_BLOCKS.map(b => <option key={b.id} value={b.id}>{b.short}</option>)}</optgroup>
                      </select>
                      {b && b.inH != null && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.3 }}>
                          <span style={{ fontSize: 8, color: bc!.color, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>{fmtT(b.inH, b.inM)}</span>
                          <span style={{ fontSize: 8, color: bc!.color, opacity: .75, fontFamily: "'DM Sans',sans-serif" }}>{fmtT(b.outH!, b.outM)}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8, padding: '8px 0', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 11, color: '#64748b', marginRight: 4, alignSelf: 'center' }}>一括設定:</span>
                {allBlocks.map(b => {
                  const c = PALETTE[b.colorIdx]
                  return (
                    <button key={b.id} onClick={() => {
                      const newDays: Record<string, string> = {}
                      rangedDates.forEach(ds => newDays[ds] = b.id)
                      setForm(p => ({ ...p, days: { ...p.days, ...newDays } }))
                    }} style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}`, padding: '2px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>{b.short}</button>
                  )
                })}
                <button onClick={() => setForm(p => ({ ...p, days: {} }))} style={{ background: '#fff', color: '#94a3b8', border: '1px solid #dde3ef', padding: '2px 8px', borderRadius: 5, fontSize: 10.5, cursor: 'pointer' }}>全クリア</button>
              </div>
            </div>
          )}
          {rangedDates.length === 0 && form.startDate && form.endDate && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>期間の開始日・終了日を確認してください</div>}
          {!form.startDate && <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>↑ 期間を設定すると日付ごとのシフト入力欄が表示されます</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={!form.label || !form.startDate || !form.endDate} style={{ background: form.label && form.startDate && form.endDate ? '#c9a84c' : '#e2e8f0', color: form.label && form.startDate && form.endDate ? '#0f2044' : '#94a3b8', border: 'none', padding: '7px 20px', borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}>保存</button>
            <button onClick={() => { setCreating(false); setEditingId(null) }} style={{ background: '#fff', color: '#0f2044', border: '1.5px solid #dde3ef', padding: '7px 14px', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}>キャンセル</button>
          </div>
        </div>
      )}

      {periodPats.length === 0 && !creating && !editingId && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: 13, border: '1.5px dashed #e2e8f0', borderRadius: 8 }}>期間限定パターンなし</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {periodPats.map(pp => {
          const c = PALETTE[pp.colorIdx]
          const dates = getDatesInRange(pp.startDate, pp.endDate)
          const setCount = Object.keys(pp.days).filter(k => pp.days[k]).length
          return (
            <div key={pp.id} style={{ border: `1.5px solid ${c.color}`, borderRadius: 9, padding: '10px 12px', background: c.bg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: c.color }}>{pp.label}</span>
                  <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>{pp.startDate} 〜 {pp.endDate}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6 }}>（{dates.length}日間・{setCount}日設定済）</span>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                  <button onClick={() => startEdit(pp)} style={{ background: '#fff', color: '#0f2044', border: '1.5px solid #dde3ef', padding: '2px 8px', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>編集</button>
                  <button onClick={() => removePeriodPat(pp.id)} style={{ background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', padding: '2px 8px', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>削除</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {dates.slice(0, 14).map(ds => {
                  const d = parseLocalDate(ds), dow = d.getDay()
                  const bid = pp.days[ds], b = bid ? allBlocks.find(x => x.id === bid) : null
                  const bc2 = b ? PALETTE[b.colorIdx] : null
                  return (
                    <div key={ds} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 24 }}>
                      <span style={{ fontSize: 8, color: dow === 0 ? '#dc2626' : dow === 6 ? '#2563eb' : '#94a3b8' }}>{d.getMonth() + 1}/{d.getDate()}</span>
                      {b ? <div style={{ background: bc2!.bg, color: bc2!.color, border: `1px solid ${bc2!.color}`, borderRadius: 3, padding: '0 2px', fontSize: 8, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{b.short}</div> : <span style={{ fontSize: 8, color: '#e2e8f0' }}>—</span>}
                    </div>
                  )
                })}
                {dates.length > 14 && <span style={{ fontSize: 9, color: '#94a3b8', alignSelf: 'flex-end' }}>+{dates.length - 14}日</span>}
              </div>
            </div>
          )
        })}
      </div>
      {!creating && !editingId && (
        <button onClick={startCreate} style={{ marginTop: 10, width: '100%', background: '#c9a84c', color: '#0f2044', border: 'none', padding: '7px', borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}>
          ＋ 期間限定パターンを作成
        </button>
      )}
    </div>
  )
}
