import type { Staff } from '@/types'
import { NameCell } from './NameCell'
import { ShiftCell } from './ShiftCell'

interface Props {
  s: Staff
  dates: Date[]
  totalH: number
  viewMode: 'weekly' | 'monthly'
}

export function StaffRow({ s, dates, totalH, viewMode }: Props) {
  return (
    <tr className={!s.active ? 'tr-inactive' : undefined}>
      <td className="td-no">{s.no}</td>
      <NameCell s={s} />
      <td className="td-io">
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: 8, fontWeight: 700 }}>
          <span style={{ color: '#0f766e', padding: '3px 0', borderBottom: '1px solid #e2e8f0', textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>入</span>
          <span style={{ color: '#dc2626', padding: '3px 0', textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>出</span>
        </div>
      </td>
      {dates.map(d => (
        <ShiftCell key={d.toISOString()} s={s} dateObj={d} mode={viewMode === 'weekly' ? 'week' : 'month'} />
      ))}
      <td className="td-sum">{totalH > 0 ? `${totalH}h` : ''}</td>
    </tr>
  )
}
