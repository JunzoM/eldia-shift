import { useState } from 'react'
import type { TimeBlock, WeeklyPattern } from '@/types'
import { PALETTE } from '@/lib/constants'
import { JP_WD } from '@/lib/constants'
import { fmtT } from '@/lib/utils'

interface Props {
  block: TimeBlock
  form: Pick<WeeklyPattern, 'days'>
  setDay: (dow: number, bid: string) => void
}

export function DayBlockChip({ block, form, setDay }: Props) {
  const [selectingDow, setSelectingDow] = useState(false)
  const c = PALETTE[block.colorIdx]
  const usedIn = [0, 1, 2, 3, 4, 5, 6].filter(d => form.days[d] === block.id)

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        onClick={() => setSelectingDow(v => !v)}
        style={{
          background: c.bg, color: c.color, border: `1.5px solid ${c.color}`,
          borderRadius: 5, padding: '3px 7px', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          fontSize: 9.5, fontWeight: 700, minWidth: 44, transition: 'all .1s',
          outline: selectingDow ? '2.5px solid #0f2044' : 'none',
        }}
      >
        <span>{block.label}</span>
        {block.inH != null && (
          <span style={{ fontSize: 8, opacity: .8, fontFamily: "'DM Sans',sans-serif" }}>
            {fmtT(block.inH, block.inM)}-{fmtT(block.outH!, block.outM)}
          </span>
        )}
        {usedIn.length > 0 && (
          <div style={{ display: 'flex', gap: 2, marginTop: 1 }}>
            {usedIn.map(d => (
              <span key={d} style={{ fontSize: 7.5, background: '#fff', color: c.color, border: `1px solid ${c.color}`, borderRadius: 3, padding: '0 2px', fontWeight: 700 }}>{JP_WD[d]}</span>
            ))}
          </div>
        )}
      </div>
      {selectingDow && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 9999,
          background: '#fff', border: '1.5px solid #dde3ef', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(15,32,68,.18)', padding: 8,
          display: 'flex', gap: 4, flexWrap: 'wrap', minWidth: 150,
        }}>
          <div style={{ width: '100%', fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>割り当てる曜日</div>
          {[1, 2, 3, 4, 5, 6, 0].map(dow => {
            const isSet = form.days[dow] === block.id
            return (
              <div key={dow} onClick={() => setDay(dow, isSet ? '' : block.id)} style={{
                padding: '4px 7px', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                background: isSet ? c.bg : '#f8faff',
                color: isSet ? c.color : dow === 0 ? '#dc2626' : dow === 6 ? '#2563eb' : '#475569',
                border: `1.5px solid ${isSet ? c.color : '#e2e8f0'}`,
              }}>
                {JP_WD[dow]}
              </div>
            )
          })}
          <button onClick={() => setSelectingDow(false)} style={{ width: '100%', marginTop: 4, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 10 }}>閉じる</button>
        </div>
      )}
    </div>
  )
}
