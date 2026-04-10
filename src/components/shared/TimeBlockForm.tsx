import { useState } from 'react'
import type { TimeBlock } from '@/types'
import { PALETTE } from '@/lib/constants'
import { calcH, fmtT, uid } from '@/lib/utils'

const SEL: React.CSSProperties = {
  border: '1.5px solid #dde3ef', borderRadius: 6, padding: '3px 8px',
  fontSize: 12, outline: 'none', background: '#f8faff', cursor: 'pointer',
  fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
}
const HH24 = Array.from({ length: 25 }, (_, i) => i)
const MM30 = [0, 30]

interface Props {
  initial?: Partial<TimeBlock> | null
  title?: string
  onSave: (block: TimeBlock) => void
  onCancel: () => void
}

export function TimeBlockForm({ initial, title = '時間テンプレートを作成', onSave, onCancel }: Props) {
  const blank = { id: '', label: '', short: '', inH: 9, inM: 0, outH: 18, outM: 0, colorIdx: 0 }
  const [form, setForm] = useState<TimeBlock>(initial ? { ...blank, ...initial } as TimeBlock : blank)
  const f = (k: keyof TimeBlock, v: TimeBlock[keyof TimeBlock]) => setForm(p => ({ ...p, [k]: v }))

  const hours = calcH(form.inH, form.inM, form.outH, form.outM)
  const isNight = hours > 12

  return (
    <div style={{ background: '#fff', border: '2px solid #c9a84c', borderRadius: 10, padding: 18, marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f2044', marginBottom: 14 }}>{title}</div>

      {/* Preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, padding: '10px 14px', background: '#f8faff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div style={{ background: PALETTE[form.colorIdx].bg, color: PALETTE[form.colorIdx].color, border: `2px solid ${PALETTE[form.colorIdx].color}`, borderRadius: 7, padding: '6px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 56 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{form.short || '略'}</span>
          <span style={{ fontSize: 10, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>{fmtT(form.inH!, form.inM)}</span>
          <span style={{ fontSize: 10, fontFamily: "'DM Sans',sans-serif", opacity: .75 }}>{fmtT(form.outH!, form.outM)}</span>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2044' }}>{form.label || '（名称未入力）'}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
            実働 <strong style={{ color: isNight ? '#7c3aed' : '#0f2044', fontSize: 14 }}>{hours}h</strong>
            {hours >= 24 && <span style={{ fontSize: 10, color: '#7c3aed', marginLeft: 6 }}>（翌日同時刻）</span>}
            {hours > 12 && hours < 24 && <span style={{ fontSize: 10, color: '#6d28d9', marginLeft: 6 }}>（日跨ぎ）</span>}
          </div>
        </div>
      </div>

      {/* Name row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>名称</label>
          <input value={form.label} onChange={e => f('label', e.target.value)} placeholder="例：宮本_日勤" autoFocus
            style={{ border: '1.5px solid #dde3ef', borderRadius: 6, padding: '6px 10px', fontSize: 13, outline: 'none', background: '#f8faff', width: 180, fontFamily: "'Noto Sans JP',sans-serif" }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>略称（3文字以内）</label>
          <input value={form.short} onChange={e => f('short', e.target.value.slice(0, 4))} placeholder="例：日"
            style={{ border: '1.5px solid #dde3ef', borderRadius: 6, padding: '6px 10px', fontSize: 13, outline: 'none', background: '#f8faff', width: 90, fontFamily: "'Noto Sans JP',sans-serif" }} />
        </div>
      </div>

      {/* Time row */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f766e', minWidth: 28 }}>IN</span>
          <select value={form.inH ?? 0} onChange={e => f('inH', +e.target.value)} style={SEL}>
            {HH24.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
          </select>
          <span style={{ color: '#94a3b8' }}>:</span>
          <select value={form.inM} onChange={e => f('inM', +e.target.value)} style={SEL}>
            {MM30.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', minWidth: 28 }}>OUT</span>
          <select value={form.outH ?? 0} onChange={e => f('outH', +e.target.value)} style={SEL}>
            {HH24.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
          </select>
          <span style={{ color: '#94a3b8' }}>:</span>
          <select value={form.outM} onChange={e => f('outM', +e.target.value)} style={SEL}>
            {MM30.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
          </select>
        </div>
      </div>

      {/* Color */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, width: 50 }}>カラー</label>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {PALETTE.map((c, i) => (
            <div key={i} onClick={() => f('colorIdx', i)} style={{
              width: 22, height: 22, borderRadius: '50%', background: c.color, cursor: 'pointer',
              border: form.colorIdx === i ? '3px solid #0f2044' : '3px solid transparent', transition: 'border .1s',
            }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onSave({ ...form, id: form.id || uid() })}
          disabled={!form.label.trim() || !form.short.trim()}
          style={{
            background: form.label && form.short ? '#c9a84c' : '#e2e8f0',
            color: form.label && form.short ? '#0f2044' : '#94a3b8',
            border: 'none', padding: '7px 20px', borderRadius: 7,
            fontWeight: 700, fontSize: 13, cursor: form.label && form.short ? 'pointer' : 'not-allowed',
            fontFamily: "'Noto Sans JP',sans-serif",
          }}>保存</button>
        <button onClick={onCancel} style={{ background: '#fff', color: '#0f2044', border: '1.5px solid #dde3ef', padding: '7px 14px', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}>キャンセル</button>
      </div>
    </div>
  )
}
