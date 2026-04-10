import { useMemo } from 'react'
import type { Dept } from '@/types'
import { INIT_DEPTS } from '@/lib/constants'
import { getDays, calcH, calcNetH, toDateStr } from '@/lib/utils'
import { useShiftStore } from '@/store/useShiftStore'
import { ShiftTableHeader } from './ShiftTableHeader'
import { DeptRow } from './DeptRow'
import { StaffRow } from './StaffRow'

interface Props {
  dates: Date[]
  viewMode: 'weekly' | 'monthly'
}

export function ShiftTable({ dates, viewMode }: Props) {
  const { staff, globalTemplates, cellData, year, month, showInactive, getEffective } = useShiftStore()

  const visibleStaff = useMemo(() => staff.filter(s => {
    if (showInactive) return true
    if (!s.leaveDate) return s.active
    const ld = new Date(s.leaveDate)
    const leaveYear = ld.getFullYear()
    const leaveMonth = ld.getMonth()
    if (year < leaveYear) return true
    if (year === leaveYear && month <= leaveMonth) return true
    return false
  }), [staff, showInactive, year, month])

  const staffByDept = useMemo(() =>
    INIT_DEPTS.map(d => ({
      ...d,
      members: visibleStaff.filter(s => s.deptId === d.id).sort((a, b) => a.no - b.no),
    })),
    [visibleStaff]
  )

  // Monthly summary: compute for the displayed month
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

  return (
    <table>
      <ShiftTableHeader dates={dates} viewMode={viewMode} />
      <tbody>
        {staffByDept.map(dept => {
          if (dept.members.length === 0) return null
          return [
            <DeptRow key={`d-${dept.id}`} dept={dept as Dept} colCount={dates.length} />,
            ...dept.members.map(s => {
              const sm = summary.find(x => x.id === s.id)
              return (
                <StaffRow
                  key={s.id}
                  s={s}
                  dates={dates}
                  totalH={sm?.totalH ?? 0}
                  viewMode={viewMode}
                />
              )
            }),
          ]
        })}
      </tbody>
    </table>
  )
}
