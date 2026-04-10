import { useMemo } from 'react'
import { useShiftStore } from '@/store/useShiftStore'
import { INIT_DEPTS, PALETTE } from '@/lib/constants'
import { getDays, calcH, calcNetH, fmtT, toDateStr } from '@/lib/utils'

export function SummaryView() {
  const { staff, globalTemplates, cellData, year, month, getEffective } = useShiftStore()

  const monthDates = useMemo(() =>
    Array.from({ length: getDays(year, month) }, (_, i) => new Date(year, month, i + 1)),
    [year, month]
  )

  const summary = useMemo(() => staff.map(s => {
    let totalH = 0, workDays = 0
    monthDates.forEach(d => {
      if (s.leaveDate && toDateStr(d) > s.leaveDate) return
      const eff = getEffective(s, d)
      if (!eff || eff.isOff) return
      if (eff.inTime && eff.outTime) {
        const [ih, im] = eff.inTime.split(':').map(Number)
        const [oh, om] = eff.outTime.split(':').map(Number)
        workDays++
        totalH += calcNetH(calcH(ih, im, oh, om))
      }
    })
    return { id: s.id, workDays, totalH: +totalH.toFixed(1) }
  }), [staff, cellData, globalTemplates, year, month])

  const staffByDept = useMemo(() =>
    INIT_DEPTS.map(d => ({
      ...d,
      members: staff.filter(s => s.deptId === d.id).sort((a, b) => a.no - b.no),
    })),
    [staff]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {staffByDept.map(dept => {
        if (dept.members.length === 0) return null
        const dc = PALETTE[dept.colorIdx]
        return (
          <div key={dept.id} style={{
            background: 'rgba(255,255,255,.72)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,.88)',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6), 0 4px 8px rgba(15,32,68,.04), 0 12px 32px rgba(15,32,68,.09)',
            borderTop: `3px solid ${dc.color}`,
          }}>
            <div style={{ background: dc.bg, color: dc.color, padding: '10px 16px', fontWeight: 600, fontSize: 13 }}>
              {dept.label} — {year}年 {month + 1}月
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ background: '#f8faff', color: '#0f2044', padding: '8px 12px', fontWeight: 700, textAlign: 'left', borderBottom: '2px solid #dde3ef', minWidth: 140 }}>スタッフ</th>
                  <th style={{ background: '#f8faff', padding: '8px 10px', fontWeight: 700, textAlign: 'center', borderBottom: '2px solid #dde3ef', color: '#0f2044' }}>出勤日数</th>
                  <th style={{ background: '#f8faff', padding: '8px 10px', fontWeight: 700, textAlign: 'center', borderBottom: '2px solid #dde3ef', color: '#0f2044' }}>総時間</th>
                  <th style={{ background: '#f8faff', padding: '8px 10px', fontWeight: 600, textAlign: 'left', borderBottom: '2px solid #dde3ef', color: '#64748b', fontSize: 11 }}>個人テンプレート</th>
                </tr>
              </thead>
              <tbody>
                {dept.members.map((s, ri) => {
                  const sm = summary.find(x => x.id === s.id)
                  if (!sm) return null
                  return (
                    <tr key={s.id} style={{ background: ri % 2 === 0 ? '#fff' : '#fafbff' }}>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>
                        <span style={{ color: '#94a3b8', fontSize: 10, marginRight: 6 }}>{s.no}</span>{s.name}
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <span style={{ background: '#e8ecf5', color: '#0f2044', padding: '2px 9px', borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 12 }}>{sm.workDays}日</span>
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <span style={{ background: '#0f2044', color: '#c9a84c', padding: '2px 9px', borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 12 }}>{sm.totalH}h</span>
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {s.timeBlocks.map(b => {
                            const c = PALETTE[b.colorIdx]
                            return (
                              <span key={b.id} style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}`, padding: '1px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700 }}>
                                {b.short} {b.inH != null ? `${fmtT(b.inH, b.inM)}-${fmtT(b.outH!, b.outM)}` : ''}
                              </span>
                            )
                          })}
                          {s.timeBlocks.length === 0 && <span style={{ fontSize: 10.5, color: '#e2e8f0' }}>—</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
