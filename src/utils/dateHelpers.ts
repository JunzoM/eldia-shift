export const JP_WD = ['日', '月', '火', '水', '木', '金', '土']

export function fmtT(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function fmtTP(h: number, m: number): string {
  return `${h}:${String(m).padStart(2, '0')}`
}

export function getDays(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate()
}

export function getDow(y: number, m: number, d: number): number {
  return new Date(y, m, d).getDay()
}

export function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const dow = d.getDay()
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow))
  d.setHours(0, 0, 0, 0)
  return d
}

export function getWeekDates(mon: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(d.getDate() + i)
    return d
  })
}

export function isToday(d: Date): boolean {
  return d.toDateString() === new Date().toDateString()
}

/** YYYY-MM-DD 文字列をローカル時間として Date に変換（タイムゾーンずれ防止） */
export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Date をローカル日付文字列 YYYY-MM-DD に変換 */
export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const cur = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)
  while (cur <= end) {
    dates.push(toLocalDateStr(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 8)
}
