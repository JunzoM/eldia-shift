import { JP_WD } from '@/lib/constants'
import { isToday } from '@/lib/utils'

interface Props {
  dates: Date[]
  viewMode: 'weekly' | 'monthly'
}

export function ShiftTableHeader({ dates, viewMode }: Props) {
  return (
    <thead>
      <tr>
        <th className="th-no">No</th>
        <th className="th-name">氏名</th>
        <th className="th-io">
          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 7.5, fontWeight: 700, gap: 1, paddingTop: 10 }}>
            <span style={{ color: '#6ee7b7' }}>入</span>
            <span style={{ color: '#fca5a5' }}>出</span>
          </div>
        </th>
        {dates.map(d => {
          const dow = d.getDay()
          const tod = isToday(d)
          const cls = `th-day${dow === 0 ? ' sun' : dow === 6 ? ' sat' : ''}${tod ? ' tod' : ''}`
          return (
            <th key={d.toISOString()} className={cls}>
              <div className="th-day-inner">
                <span style={{ fontSize: 11, fontWeight: 700 }}>
                  {viewMode === 'weekly' ? `${d.getMonth() + 1}/${d.getDate()}` : d.getDate()}
                </span>
                <span style={{ fontSize: 9.5, opacity: .75 }}>{JP_WD[dow]}</span>
              </div>
            </th>
          )
        })}
        <th className="th-sum">合計</th>
      </tr>
    </thead>
  )
}
