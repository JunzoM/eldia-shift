import { useState, useMemo } from 'react'
import type { Staff, TimeBlock, WeeklyPattern } from '@/types'
import { PALETTE, OFF_BLOCKS, JP_WD } from '@/lib/constants'
import { fmtT, uid } from '@/lib/utils'
import { DayBlockChip } from './DayBlockChip'

interface Props {
  initial?: WeeklyPattern | null
  s: Staff
  globalTemplates: TimeBlock[]
  onSave: (form: WeeklyPattern) => void
  onCancel: () => void
}

export function PatternEditor({ initial, s, globalTemplates, onSave, onCancel }: Props) {
  const blank: WeeklyPattern = { id: '', label: '', days: ['', '', '', '', '', '', ''], colorIdx: 0, activeFrom: '' }
  const [form, setForm] = useState<WeeklyPattern>(initial ? { ...initial } : blank)
  const f = (k: keyof WeeklyPattern, v: WeeklyPattern[keyof WeeklyPattern]) => setForm(p => ({ ...p, [k]: v }))
  const setDay = (dow: number, v: string) => setForm(p => { const d = [...p.days]; d[dow] = v; return { ...p, days: d } })

  const allBlocks = useMemo(() => [...s.timeBlocks, ...globalTemplates, ...OFF_BLOCKS], [s.timeBlocks, globalTemplates])

  return (
    <div style={{ background: '#fff', border: '1.5px solid #c9a84c', borderRadius: 10, padding: 18, marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2044', marginBottom: 14 }}>
        {s.name} の週間パターン {initial ? 'を編集' : 'を作成'}
      </div>

      {/* Pattern name + color + activeFrom */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>パターン名</label>
          <input value={form.label} onChange={e => f('label', e.target.value)} placeholder="例：通常・夜勤週・Aパターン" autoFocus
            style={{ border: '1.5px solid #dde3ef', borderRadius: 6, padding: '6px 10px', fontSize: 13, outline: 'none', background: '#f8faff', width: 200, fontFamily: "'Noto Sans JP',sans-serif" }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
            適用開始日
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400, marginLeft: 4 }}>（空白=デフォルト）</span>
          </label>
          <input type="date" value={form.activeFrom || ''} onChange={e => f('activeFrom', e.target.value)}
            style={{ border: `1.5px solid ${form.activeFrom ? '#c9a84c' : '#dde3ef'}`, borderRadius: 6, padding: '5px 8px', fontSize: 12, outline: 'none', background: '#f8faff' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>カラー</label>
          <div style={{ display: 'flex', gap: 5, paddingBottom: 6 }}>
            {PALETTE.map((c, i) => (
              <div key={i} onClick={() => f('colorIdx', i)} style={{ width: 20, height: 20, borderRadius: '50%', background: c.color, cursor: 'pointer', border: form.colorIdx === i ? '3px solid #0f2044' : '3px solid transparent', transition: 'border .1s' }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f2044', marginBottom: 8 }}>曜日ごとのシフトを選択</div>

      {/* Block palette */}
      <div style={{ background: '#f8faff', borderRadius: 8, padding: '10px 12px', marginBottom: 12, border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>使えるブロック（クリックで曜日に割り当て）</div>
        {s.timeBlocks.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: '#0f766e', fontWeight: 700, marginBottom: 5 }}>👤 個人テンプレート</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {s.timeBlocks.map(b => <DayBlockChip key={b.id} block={b} form={form} setDay={setDay} />)}
            </div>
          </div>
        )}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: '#6d28d9', fontWeight: 700, marginBottom: 5 }}>🌐 共通テンプレート</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {globalTemplates.map(b => <DayBlockChip key={b.id} block={b} form={form} setDay={setDay} />)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 5 }}>休日</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {OFF_BLOCKS.map(b => <DayBlockChip key={b.id} block={b} form={form} setDay={setDay} />)}
          </div>
        </div>
      </div>

      {/* 7-day visual */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 16 }}>
        {[1, 2, 3, 4, 5, 6, 0].map(dow => {
          const bid = form.days[dow]
          const b = allBlocks.find(x => x.id === bid)
          const c = b ? PALETTE[b.colorIdx] : null
          return (
            <div key={dow} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: dow === 0 ? '#dc2626' : dow === 6 ? '#2563eb' : '#475569' }}>{JP_WD[dow]}</span>
              <div style={{ width: '100%', minHeight: 52, border: `1.5px ${b ? 'solid' : 'dashed'} ${c ? c.color : '#dde3ef'}`, borderRadius: 6, background: b ? c!.bg : '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '2px', transition: 'all .1s' }}>
                {b ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: c!.color }}>{b.short}</span>
                    {b.inH != null && <>
                      <span style={{ fontSize: 8.5, color: c!.color, fontFamily: "'DM Sans',sans-serif" }}>{fmtT(b.inH, b.inM)}</span>
                      <span style={{ fontSize: 8.5, color: c!.color, opacity: .7, fontFamily: "'DM Sans',sans-serif" }}>{fmtT(b.outH!, b.outM)}</span>
                    </>}
                  </div>
                ) : <span style={{ color: '#e2e8f0', fontSize: 16 }}>+</span>}
              </div>
              {b && <button onClick={() => setDay(dow, '')} style={{ fontSize: 9, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕</button>}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onSave({ ...form, id: form.id || uid() })} style={{ background: '#c9a84c', color: '#0f2044', border: 'none', padding: '7px 20px', borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}>保存</button>
        <button onClick={onCancel} style={{ background: '#fff', color: '#0f2044', border: '1.5px solid #dde3ef', padding: '7px 14px', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}>キャンセル</button>
      </div>
    </div>
  )
}
