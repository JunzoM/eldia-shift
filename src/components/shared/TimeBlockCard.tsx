import type { TimeBlock } from '@/types'
import { PALETTE } from '@/lib/constants'
import { calcH, fmtT } from '@/lib/utils'

interface Props {
  block: TimeBlock
  onEdit?: () => void
  onDelete?: () => void
  selected?: boolean
  onClick?: () => void
}

export function TimeBlockCard({ block, onEdit, onDelete, selected, onClick }: Props) {
  const c = PALETTE[block.colorIdx]
  const h = block.inH != null ? calcH(block.inH, block.inM, block.outH!, block.outM) : null

  return (
    <div onClick={onClick} style={{
      border: `2px solid ${selected ? '#0f2044' : c.color}`,
      borderRadius: 9, background: selected ? '#f0f9ff' : c.bg,
      padding: '10px 12px', cursor: onClick ? 'pointer' : 'default',
      transition: 'all .15s', position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: onEdit ? 8 : 0 }}>
        <div style={{ background: '#fff', color: c.color, border: `1.5px solid ${c.color}`, borderRadius: 6, padding: '4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48, flexShrink: 0 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700 }}>{block.short}</span>
          {block.inH != null && <>
            <span style={{ fontSize: 8.5, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>{fmtT(block.inH, block.inM)}</span>
            <span style={{ fontSize: 8.5, fontFamily: "'DM Sans',sans-serif", opacity: .7 }}>{fmtT(block.outH!, block.outM)}</span>
          </>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f2044', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{block.label}</div>
          {h != null && <div style={{ fontSize: 11, color: c.color, fontWeight: 600, marginTop: 2 }}>{h}h</div>}
        </div>
      </div>
      {onEdit && (
        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={e => { e.stopPropagation(); onEdit() }} style={{ flex: 1, background: '#fff', color: '#0f2044', border: '1.5px solid #dde3ef', padding: '3px 0', borderRadius: 5, fontSize: 11, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}>編集</button>
          {onDelete && <button onClick={e => { e.stopPropagation(); onDelete() }} style={{ background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', padding: '3px 8px', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>✕</button>}
        </div>
      )}
    </div>
  )
}
