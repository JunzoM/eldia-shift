import type { TimeBlock } from '@/types'

export const OFF_BLOCKS: TimeBlock[] = [
  { id: 'off1', label: '公休', short: '休', inH: null, inM: null, outH: null, outM: null, colorIdx: 4 },
  { id: 'off2', label: '有休', short: '有', inH: null, inM: null, outH: null, outM: null, colorIdx: 3 },
  { id: 'off3', label: '当欠', short: '欠', inH: null, inM: null, outH: null, outM: null, colorIdx: 7 },
]
