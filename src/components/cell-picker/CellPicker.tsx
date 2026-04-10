import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Staff, TimeBlock } from '@/types'
import { PALETTE, OFF_BLOCKS } from '@/lib/constants'
import { fmtT } from '@/lib/utils'
import { DirectTimeInput } from './DirectTimeInput'

interface Props {
  s: Staff
  globalTemplates: TimeBlock[]
  currentBlockId?: string | null
  onSelect: (block: TimeBlock | null) => void
  onSelectCustomTime: (inTime: string, outTime: string) => void
  onClose: () => void
}

function Block({ b, currentBlockId, onSelect }: { b: TimeBlock; currentBlockId?: string | null; onSelect: (b: TimeBlock) => void }) {
  const c = PALETTE[b.colorIdx]
  const sel = currentBlockId === b.id
  return (
    <div onClick={() => onSelect(b)} style={{
      background: sel ? c.bg : 'transparent', color: c.color,
      border: `1.5px ${sel ? 'solid' : 'dashed'} ${c.color}`,
      borderRadius: 7, padding: '6px 10px', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontSize: 11, fontWeight: 700, minWidth: 60, transition: 'all .1s',
    }}>
      <span>{b.label}</span>
      {b.inH != null && <>
        <span style={{ fontSize: 10, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>{fmtT(b.inH, b.inM)}</span>
        <span style={{ fontSize: 10, opacity: .7, fontFamily: "'DM Sans',sans-serif" }}>{fmtT(b.outH!, b.outM)}</span>
      </>}
    </div>
  )
}

export function CellPicker({ s, globalTemplates, currentBlockId, onSelect, onSelectCustomTime, onClose }: Props) {
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k) }
  }, [onClose])

  const personalFiltered = search
    ? s.timeBlocks.filter(b => b.label.includes(search) || b.short.includes(search))
    : s.timeBlocks
  const globalFiltered = search
    ? globalTemplates.filter(b => b.label.includes(search) || b.short.includes(search))
    : globalTemplates

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 9998 }} />
      <div ref={ref} style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 9999, background: '#fff',
        border: '1.5px solid #dde3ef', borderRadius: 12,
        boxShadow: '0 20px 60px rgba(15,32,68,.35)',
        padding: '20px',
        width: 'min(480px, 90vw)',
        maxHeight: '80vh', overflowY: 'auto',
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="検索..."
          autoFocus
          style={{
            width: '100%', border: '1.5px solid #dde3ef', borderRadius: 6,
            padding: '4px 8px', fontSize: 11.5, outline: 'none', background: '#f8faff',
            marginBottom: 10, fontFamily: "'Noto Sans JP',sans-serif",
          }}
        />

        {/* Personal */}
        {personalFiltered.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f766e', marginBottom: 8, letterSpacing: '.02em' }}>👤 {s.name} の個人テンプレート</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {personalFiltered.map(b => <Block key={b.id} b={b} currentBlockId={currentBlockId} onSelect={onSelect} />)}
            </div>
          </div>
        )}

        {/* Global */}
        {globalFiltered.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#6d28d9', marginBottom: 8, letterSpacing: '.02em' }}>🌐 共通テンプレート</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 100, overflowY: 'auto' }}>
              {globalFiltered.map(b => <Block key={b.id} b={b} currentBlockId={currentBlockId} onSelect={onSelect} />)}
            </div>
          </div>
        )}

        {/* Off blocks */}
        {!search && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', marginBottom: 5 }}>休日</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {OFF_BLOCKS.map(b => {
                const c = PALETTE[b.colorIdx]
                const sel = currentBlockId === b.id
                return (
                  <div key={b.id} onClick={() => onSelect(b)} style={{
                    background: sel ? c.bg : 'transparent', color: c.color,
                    border: `1.5px ${sel ? 'solid' : 'dashed'} ${c.color}`,
                    borderRadius: 5, padding: '4px 10px', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700,
                  }}>{b.label}</div>
                )
              })}
            </div>
          </div>
        )}

        {/* Direct time input */}
        {!search && <DirectTimeInput onApply={onSelectCustomTime} onClose={onClose} />}

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => onSelect(null)} style={{ fontSize: 12, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>✕ クリア</button>
          <button onClick={onClose} style={{ fontSize: 12, color: '#fff', background: '#0f2044', border: 'none', borderRadius: 6, padding: '4px 14px', cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}>閉じる</button>
        </div>
      </div>
    </>,
    document.body
  )
}
