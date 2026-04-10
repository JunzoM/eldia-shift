import { useState } from 'react'
import type { Staff } from '@/types'
import { PALETTE } from '@/lib/constants'
import { isToday, fmtT, findBlock } from '@/lib/utils'
import { useShiftStore } from '@/store/useShiftStore'
import { CellPicker } from '@/components/cell-picker/CellPicker'

interface Props {
  s: Staff
  dateObj: Date
  mode?: 'week' | 'month'
}

export function ShiftCell({ s, dateObj, mode = 'month' }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const { globalTemplates, getEffective, setCellEntry, clearCell } = useShiftStore()

  const leaveDate = s.leaveDate ? new Date(s.leaveDate) : null
  const isAfterLeave = leaveDate ? dateObj > leaveDate : false

  const eff = isAfterLeave ? null : getEffective(s, dateObj)
  const b = eff?.blockId ? findBlock(eff.blockId, s.timeBlocks, globalTemplates) : null
  const bc = b ? PALETTE[b.colorIdx] : null

  const isSun = dateObj.getDay() === 0
  const isSat = dateObj.getDay() === 6
  const tod = isToday(dateObj)
  const auto = eff?.auto

  const bg = isAfterLeave
    ? '#f1f5f9'
    : eff?.isOff
    ? bc?.bg
    : isSun ? '#fff5f5' : isSat ? '#f0f5ff' : '#fff'

  const W = mode === 'week' ? 80 : 52

  function handleSelect(block: typeof b) {
    if (!block) { clearCell(s.id, dateObj); return }
    if (block.inH === null) {
      setCellEntry(s.id, dateObj, { inTime: '', outTime: '', blockId: block.id, isOff: true })
    } else {
      setCellEntry(s.id, dateObj, {
        inTime: fmtT(block.inH, block.inM),
        outTime: fmtT(block.outH!, block.outM),
        blockId: block.id,
        isOff: false,
      })
    }
    setPickerOpen(false)
  }

  function handleSelectCustomTime(inTime: string, outTime: string) {
    setCellEntry(s.id, dateObj, { inTime, outTime, blockId: undefined, isOff: false })
    setPickerOpen(false)
  }

  return (
    <>
      <td
        onClick={isAfterLeave ? undefined : () => setPickerOpen(true)}
        style={{
          height: mode === 'week' ? 58 : 52,
          textAlign: 'center', cursor: isAfterLeave ? 'default' : 'pointer',
          padding: 2, background: bg,
          outline: tod && !isAfterLeave ? '2px solid #c9a84c' : 'none',
          outlineOffset: '-2px', verticalAlign: 'middle',
          border: '1px solid #e2e8f0', position: 'relative', userSelect: 'none',
          minWidth: W, width: W,
          opacity: isAfterLeave ? 0.35 : 1,
        }}
        onMouseEnter={isAfterLeave ? undefined : e => (e.currentTarget.style.filter = 'brightness(.92)')}
        onMouseLeave={isAfterLeave ? undefined : e => (e.currentTarget.style.filter = '')}
      >
        {isAfterLeave ? (
          <span style={{ color: '#cbd5e1', fontSize: 11 }}>－</span>
        ) : eff?.isOff ? (
          /* 休日ブロック — 略称バッジのみ表示 */
          <span style={{
            display: 'inline-block',
            fontSize: 12, fontWeight: 800,
            color: bc?.color,
            background: bc?.bg,
            border: `1.5px solid ${bc?.color}`,
            borderRadius: 5,
            padding: '2px 5px',
            lineHeight: 1.3,
          }}>{b?.short}</span>
        ) : eff ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, lineHeight: 1.45 }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#0f766e', fontFamily: "'DM Sans',sans-serif" }}>{eff.inTime || '—'}</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#dc2626', fontFamily: "'DM Sans',sans-serif" }}>{eff.outTime || '—'}</span>
          </div>
        ) : (
          <span style={{ color: '#e2e8f0', fontSize: 16 }}>+</span>
        )}
        {auto && eff && <span style={{ position: 'absolute', top: 2, right: 2, width: 4, height: 4, borderRadius: '50%', background: '#c9a84c' }} />}
        {/* 略称はワークシフトのみ下部に表示（休日は上のバッジで表示済み） */}
        {bc && eff && !eff.isOff && <span style={{ position: 'absolute', bottom: 1, left: 0, right: 0, textAlign: 'center', fontSize: 7, color: bc.color, fontWeight: 700 }}>{b?.short}</span>}
      </td>

      {pickerOpen && (
        <CellPicker
          s={s}
          globalTemplates={globalTemplates}
          currentBlockId={eff?.blockId}
          onSelect={handleSelect}
          onSelectCustomTime={handleSelectCustomTime}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  )
}
