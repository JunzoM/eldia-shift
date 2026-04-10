import { useState } from 'react'
import { calcH } from '@/lib/utils'

interface Props {
  onApply: (inTime: string, outTime: string) => void
  onClose: () => void
}

const SEL: React.CSSProperties = {
  border: '1.5px solid #dde3ef', borderRadius: 6, padding: '3px 8px',
  fontSize: 12, outline: 'none', background: '#f8faff', cursor: 'pointer',
  fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
}

const HH = Array.from({ length: 25 }, (_, i) => i)
const MM = [0, 30]

function parseTime(str: string): { h: number; m: number } | null {
  if (!str) return null
  const [h, m] = str.split(':').map(Number)
  return { h, m }
}

export function DirectTimeInput({ onApply, onClose }: Props) {
  const [inTime, setInTime] = useState('')
  const [outTime, setOutTime] = useState('')
  const [open, setOpen] = useState(false)

  const inP = parseTime(inTime)
  const outP = parseTime(outTime)
  const hours = inP && outP ? calcH(inP.h, inP.m, outP.h, outP.m) : null

  function apply() {
    if (!inTime || !outTime) return
    onApply(inTime, outTime)
    onClose()
  }

  if (!open) {
    return (
      <div style={{ borderTop: '1px solid #f1f5f9', padding: '8px 0 4px' }}>
        <button onClick={() => setOpen(true)} style={{
          width: '100%', background: '#f8faff', border: '1.5px dashed #dde3ef',
          borderRadius: 7, padding: '7px', cursor: 'pointer',
          fontSize: 12.5, color: '#64748b', fontFamily: "'Noto Sans JP',sans-serif",
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          ✏️ この日だけ直接時刻入力
        </button>
      </div>
    )
  }

  return (
    <div style={{ borderTop: '1px solid #f1f5f9', padding: '12px 0 4px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2044', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        ✏️ この日だけ直接入力
        <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 400 }}>— テンプレートは使わない</span>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
        {/* IN */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f766e', minWidth: 20 }}>入</span>
          <select value={inP?.h ?? ''} onChange={e => setInTime(e.target.value !== '' ? `${String(e.target.value).padStart(2, '0')}:${String(inP?.m ?? 0).padStart(2, '0')}` : '')} style={SEL}>
            <option value="">--</option>
            {HH.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
          </select>
          <span style={{ color: '#94a3b8' }}>:</span>
          <select value={inP?.m ?? ''} onChange={e => setInTime(inP ? `${String(inP.h).padStart(2, '0')}:${String(e.target.value).padStart(2, '0')}` : '')} style={SEL}>
            <option value="">--</option>
            {MM.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
          </select>
        </div>
        {/* OUT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', minWidth: 20 }}>出</span>
          <select value={outP?.h ?? ''} onChange={e => setOutTime(e.target.value !== '' ? `${String(e.target.value).padStart(2, '0')}:${String(outP?.m ?? 0).padStart(2, '0')}` : '')} style={SEL}>
            <option value="">--</option>
            {HH.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
          </select>
          <span style={{ color: '#94a3b8' }}>:</span>
          <select value={outP?.m ?? ''} onChange={e => setOutTime(outP ? `${String(outP.h).padStart(2, '0')}:${String(e.target.value).padStart(2, '0')}` : '')} style={SEL}>
            <option value="">--</option>
            {MM.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
          </select>
        </div>
        {hours !== null && (
          <span style={{ fontSize: 12, color: '#64748b' }}>
            → <strong style={{ color: '#0f2044' }}>{hours}h</strong>
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={apply} disabled={!inTime || !outTime} style={{
          background: inTime && outTime ? '#c9a84c' : '#e2e8f0',
          color: inTime && outTime ? '#0f2044' : '#94a3b8',
          border: 'none', padding: '6px 18px', borderRadius: 7,
          fontWeight: 700, fontSize: 12.5, cursor: inTime && outTime ? 'pointer' : 'not-allowed',
          fontFamily: "'Noto Sans JP',sans-serif",
        }}>適用</button>
        <button onClick={() => setOpen(false)} style={{
          background: '#fff', color: '#64748b', border: '1.5px solid #dde3ef',
          padding: '6px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
          fontFamily: "'Noto Sans JP',sans-serif",
        }}>キャンセル</button>
      </div>
    </div>
  )
}
