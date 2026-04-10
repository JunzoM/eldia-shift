import type { Dept } from '@/types'
import { PALETTE } from '@/lib/constants'

interface Props {
  dept: Dept
  colCount: number
}

export function DeptRow({ dept, colCount }: Props) {
  const dc = PALETTE[dept.colorIdx]
  return (
    <tr className="tr-dept">
      <td
        colSpan={colCount + 4}
        style={{
          background: dc.bg,
          color: dc.color,
          borderLeft: `3px solid ${dc.color}`,
          position: 'sticky',
          left: 0,
        }}
      >
        ▍ {dept.label}
      </td>
    </tr>
  )
}
