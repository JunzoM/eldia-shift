import type { Staff, TimeBlock, CellData, Department } from '@/types'
import { PALETTE } from '@/constants/palette'
import { getEffective, findBlock, calcNetH } from './shiftLogic'
import { JP_WD, fmtT, isToday } from './dateHelpers'

export type PrintFormat = 'weekly-portrait' | 'monthly-portrait' | 'monthly-landscape'

interface PrintData {
  format: PrintFormat
  year: number
  month: number
  dates: Date[]
  staffByDept: Array<Department & { members: Staff[] }>
  globalTemplates: TimeBlock[]
  cellData: CellData
  showInactive: boolean
}

function cellStyle(block: TimeBlock | null): string {
  if (!block) return 'background:#fff;'
  const c = PALETTE[block.colorIdx]
  return `background:${c.bg};color:${c.color};`
}

function renderCell(s: Staff, d: Date, globalTemplates: TimeBlock[], cellData: CellData, mode: 'compact' | 'full'): string {
  const eff = getEffective(s, d, cellData, globalTemplates)
  if (!eff) return '<td style="border:0.5pt solid #ccc;"></td>'
  const block = eff.blockId ? findBlock(eff.blockId, s.timeBlocks, globalTemplates) : null
  const style = cellStyle(block)

  if (eff.isOff) {
    return `<td style="border:0.5pt solid #ccc;${style}text-align:center;font-size:8pt;font-weight:700;">${block?.short ?? '休'}</td>`
  }

  if (mode === 'compact') {
    return `<td style="border:0.5pt solid #ccc;${style}text-align:center;font-size:7pt;font-weight:700;">${block?.short ?? ''}</td>`
  }

  return `<td style="border:0.5pt solid #ccc;${style}padding:1pt 2pt;vertical-align:middle;">
    <div style="font-size:8pt;font-weight:700;text-align:center;">${block?.short ?? ''}</div>
    <div style="font-family:monospace;font-size:6.5pt;text-align:center;">${eff.inTime}</div>
    <div style="font-family:monospace;font-size:6.5pt;text-align:center;opacity:.8;">${eff.outTime}</div>
  </td>`
}

function buildTable(data: PrintData, depts: typeof data.staffByDept, dates: Date[], isLandscape: boolean): string {
  const fs = isLandscape ? '7.5pt' : '8pt'
  const cellW = isLandscape ? '17pt' : '21pt'
  const nameW = isLandscape ? '42pt' : '46pt'
  const mode = dates.length > 7 ? 'compact' : 'full'

  const header = `
    <thead><tr>
      <th style="background:#000;color:#fff;width:14pt;font-size:7pt;border:0.5pt solid #000;text-align:center;padding:4pt 2pt;">No</th>
      <th style="background:#000;color:#fff;width:${nameW};text-align:center;border:0.5pt solid #000;font-weight:700;padding:4pt;">氏名</th>
      ${dates.map(d => {
        const dow = d.getDay()
        const bg = dow === 0 ? '#555' : dow === 6 ? '#888' : '#000'
        return `<th style="background:${bg};color:#fff;width:${cellW};text-align:center;border:0.5pt solid #000;padding:2pt 0;font-size:7pt;">
          <div>${d.getMonth() + 1}/${d.getDate()}</div>
          <div style="font-size:6pt;">${JP_WD[dow]}</div>
        </th>`
      }).join('')}
    </tr></thead>`

  const rows = depts.flatMap(dept => {
    const deptRow = `<tr>
      <td colspan="${dates.length + 2}" style="background:#222;color:#fff;font-size:7pt;font-weight:700;padding:2pt 4pt;border:0.5pt solid #000;">
        ${dept.label}
      </td>
    </tr>`

    const staffRows = dept.members.map(s => {
      const cells = dates.map(d => renderCell(s, d, data.globalTemplates, data.cellData, mode)).join('')
      return `<tr>
        <td style="border:0.5pt solid #ccc;text-align:center;font-size:7pt;font-family:monospace;">${s.no}</td>
        <td style="border:0.5pt solid #ccc;padding:1pt 3pt;font-size:${fs};font-weight:600;">${s.name}</td>
        ${cells}
      </tr>`
    }).join('')

    return [deptRow, staffRows].join('')
  }).join('')

  return `<table style="border-collapse:collapse;width:100%;table-layout:fixed;font-size:${fs};">
    ${header}
    <tbody>${rows}</tbody>
  </table>`
}

export function buildPrintHTML(data: PrintData): string {
  const isLandscape = data.format === 'monthly-landscape'
  const pageSize = isLandscape ? 'A4 landscape' : 'A4 portrait'
  const label = `${data.year}年${data.month + 1}月`

  const tableHTML = buildTable(data, data.staffByDept, data.dates, isLandscape)

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>シフト表 ${label}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap">
<style>
@page { size: ${pageSize}; margin: 8mm 6mm; }
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { background: #fff; font-family: 'Noto Sans JP', sans-serif; }
table { border-collapse: collapse; }
</style>
</head>
<body>
<div style="font-size:10pt;font-weight:700;margin-bottom:6pt;">HOTEL ELDIA シフト表 — ${label}</div>
${tableHTML}
</body>
</html>`
}

export function doPrint(html: string) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    alert('ポップアップをブロックしています。ブラウザの設定を確認してください。')
    return
  }

  win.document.write(html)
  win.document.close()

  win.onload = () => {
    setTimeout(() => {
      win.print()
      setTimeout(() => win.close(), 1000)
    }, 800)
  }

  setTimeout(() => {
    if (!win.closed) {
      win.print()
      setTimeout(() => win.close(), 1000)
    }
  }, 2000)
}
