import type { PaletteEntry, TimeBlock, Staff, Dept } from '@/types'

export const JP_WD = ['日', '月', '火', '水', '木', '金', '土']

export const PALETTE: PaletteEntry[] = [
  { color: '#1d4ed8', bg: '#dbeafe' },  // 0 blue
  { color: '#6d28d9', bg: '#ede9fe' },  // 1 purple
  { color: '#0f766e', bg: '#ccfbf1' },  // 2 teal
  { color: '#b45309', bg: '#fef3c7' },  // 3 amber
  { color: '#dc2626', bg: '#fee2e2' },  // 4 red
  { color: '#059669', bg: '#d1fae5' },  // 5 green
  { color: '#0369a1', bg: '#e0f2fe' },  // 6 sky
  { color: '#be185d', bg: '#fce7f3' },  // 7 pink
  { color: '#334155', bg: '#f1f5f9' },  // 8 slate
  { color: '#7c3aed', bg: '#f5f3ff' },  // 9 violet
]

export const OFF_BLOCKS: TimeBlock[] = [
  { id: 'off1', label: '公休', short: '休', inH: null, inM: 0, outH: null, outM: 0, colorIdx: 4 },
  { id: 'off2', label: '有休', short: '有', inH: null, inM: 0, outH: null, outM: 0, colorIdx: 3 },
  { id: 'off3', label: '当欠', short: '欠', inH: null, inM: 0, outH: null, outM: 0, colorIdx: 7 },
]

export const INIT_DEPTS: Dept[] = [
  { id: 'make',    label: 'メイク',   colorIdx: 7 },
  { id: 'kitchen', label: 'キッチン', colorIdx: 2 },
  { id: 'front',   label: 'フロント', colorIdx: 0 },
]

export const INIT_GLOBAL_TEMPLATES: TimeBlock[] = [
  { id: 'g01', label: '12H日勤',   short: '12日', inH: 10, inM: 0,  outH: 22, outM: 0,  colorIdx: 0 },
  { id: 'g02', label: '12H夜勤',   short: '12夜', inH: 22, inM: 0,  outH: 10, outM: 0,  colorIdx: 8 },
  { id: 'g03', label: '24H勤務',   short: '24',   inH: 10, inM: 0,  outH: 10, outM: 0,  colorIdx: 1 },
  { id: 'g04', label: '朝番',      short: '朝',   inH: 9,  inM: 0,  outH: 18, outM: 0,  colorIdx: 2 },
  { id: 'g05', label: '夕番',      short: '夕',   inH: 18, inM: 0,  outH: 21, outM: 0,  colorIdx: 3 },
  { id: 'g06', label: '夜勤',      short: '夜',   inH: 21, inM: 0,  outH: 9,  outM: 0,  colorIdx: 8 },
  { id: 'g07', label: 'M日勤',     short: 'M日',  inH: 9,  inM: 0,  outH: 18, outM: 0,  colorIdx: 5 },
  { id: 'g08', label: 'M夕番',     short: 'M夕',  inH: 18, inM: 0,  outH: 24, outM: 0,  colorIdx: 3 },
  { id: 'g09', label: 'M夜勤',     short: 'M夜',  inH: 20, inM: 0,  outH: 6,  outM: 0,  colorIdx: 8 },
  { id: 'g10', label: 'M 12H',     short: 'M12',  inH: 9,  inM: 0,  outH: 21, outM: 0,  colorIdx: 9 },
  { id: 'g11', label: '深夜',      short: '深',   inH: 20, inM: 30, outH: 6,  outM: 30, colorIdx: 8 },
  { id: 'g12', label: 'フロント短', short: '短',   inH: 9,  inM: 0,  outH: 15, outM: 0,  colorIdx: 6 },
  { id: 'g13', label: 'フロント昼', short: '昼',   inH: 9,  inM: 0,  outH: 21, outM: 0,  colorIdx: 0 },
]

export const INIT_STAFF: Staff[] = [
  { id: 1,  no: 1,  name: '宮本賢央',   deptId: 'front',   active: true,  joinDate: '2024-04-01', leaveDate: '',
    timeBlocks: [
      { id: 'b1a', label: '宮本_昼', short: '昼', inH: 9,  inM: 0, outH: 15, outM: 0, colorIdx: 6 },
      { id: 'b1b', label: '宮本_夜', short: '夜', inH: 15, inM: 0, outH: 21, outM: 0, colorIdx: 8 },
    ],
    patterns: [{ id: 'p1', label: '通常', colorIdx: 0, days: ['off1', 'b1a', 'b1b', 'off1', 'b1a', 'b1b', 'off1'] }],
    activePatternId: 'p1', periodPatterns: [] },
  { id: 2,  no: 2,  name: '村井淳三',   deptId: 'front',   active: true,  joinDate: '2023-01-01', leaveDate: '',
    timeBlocks: [{ id: 'b2a', label: '村井_昼', short: '昼', inH: 9, inM: 0, outH: 21, outM: 0, colorIdx: 0 }],
    patterns: [{ id: 'p2', label: '通常', colorIdx: 0, days: ['b2a', 'b2a', 'b2a', 'b2a', 'b2a', 'off1', 'off1'] }],
    activePatternId: 'p2', periodPatterns: [] },
  { id: 3,  no: 3,  name: '天野秀',     deptId: 'front',   active: true,  joinDate: '2023-06-01', leaveDate: '', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 4,  no: 4,  name: '坂井孝之',   deptId: 'front',   active: true,  joinDate: '2024-01-01', leaveDate: '', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 5,  no: 5,  name: '高',         deptId: 'front',   active: true,  joinDate: '2024-06-01', leaveDate: '', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 6,  no: 6,  name: 'ニマンティ', deptId: 'front',   active: true,  joinDate: '2024-01-01', leaveDate: '', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 7,  no: 7,  name: 'ピア',       deptId: 'front',   active: true,  joinDate: '2024-03-01', leaveDate: '', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 8,  no: 8,  name: 'カイン',     deptId: 'front',   active: true,  joinDate: '2024-01-01', leaveDate: '', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 9,  no: 9,  name: 'ラビィ',     deptId: 'front',   active: true,  joinDate: '2024-05-01', leaveDate: '', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 10, no: 10, name: '岩倉直輝',   deptId: 'front',   active: true,  joinDate: '2024-04-01', leaveDate: '', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 11, no: 11, name: 'ショボン',   deptId: 'front',   active: true,  joinDate: '2024-07-01', leaveDate: '', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 12, no: 12, name: 'ザハン',     deptId: 'front',   active: true,  joinDate: '2024-08-01', leaveDate: '', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 13, no: 13, name: 'タンジナ',   deptId: 'front',   active: true,  joinDate: '2024-09-01', leaveDate: '', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 14, no: 14, name: 'カマラ',     deptId: 'front',   active: false, joinDate: '2024-01-01', leaveDate: '2026-03-08', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 15, no: 15, name: 'スレス',     deptId: 'front',   active: true,  joinDate: '2024-10-01', leaveDate: '', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 16, no: 16, name: 'クマリ',     deptId: 'front',   active: false, joinDate: '2024-01-01', leaveDate: '2026-03-06', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 17, no: 17, name: 'サラマ',     deptId: 'front',   active: true,  joinDate: '2025-01-01', leaveDate: '', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 18, no: 18, name: 'ゴーデル',   deptId: 'front',   active: true,  joinDate: '2025-03-08', leaveDate: '', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 19, no: 19, name: 'バラット',   deptId: 'front',   active: false, joinDate: '2025-01-01', leaveDate: '2026-03-10', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 20, no: 20, name: '倉貫加代',   deptId: 'front',   active: true,  joinDate: '2024-04-01', leaveDate: '',
    timeBlocks: [{ id: 'b20a', label: '倉貫_夜', short: '夜', inH: 20, inM: 30, outH: 6,  outM: 30, colorIdx: 8 }],
    patterns: [{ id: 'p20', label: '夜勤週', colorIdx: 8, days: ['b20a', 'off1', 'b20a', 'off1', 'off1', 'b20a', 'b20a'] }],
    activePatternId: 'p20', periodPatterns: [] },
  { id: 21, no: 21, name: '坂元拓也',   deptId: 'front',   active: true,  joinDate: '2024-04-01', leaveDate: '',
    timeBlocks: [{ id: 'b21a', label: '坂元_夜', short: '夜', inH: 20, inM: 0, outH: 7, outM: 0, colorIdx: 8 }],
    patterns: [{ id: 'p21', label: '夜勤週', colorIdx: 8, days: ['b21a', 'b21a', 'b21a', 'b21a', 'b21a', 'off1', 'off1'] }],
    activePatternId: 'p21', periodPatterns: [] },
  { id: 22, no: 1,  name: '川田',       deptId: 'kitchen', active: true,  joinDate: '2024-01-01', leaveDate: '',
    timeBlocks: [{ id: 'bk1a', label: '川田_朝', short: '朝', inH: 9, inM: 0, outH: 13, outM: 0, colorIdx: 2 }],
    patterns: [], activePatternId: null, periodPatterns: [] },
  { id: 23, no: 2,  name: '赤松',       deptId: 'kitchen', active: true,  joinDate: '2024-01-01', leaveDate: '',
    timeBlocks: [{ id: 'bk2a', label: '赤松_日', short: '日', inH: 9, inM: 0, outH: 21, outM: 0, colorIdx: 2 }],
    patterns: [{ id: 'pk2', label: '通常', colorIdx: 2, days: ['bk2a', 'bk2a', 'off1', 'bk2a', 'bk2a', 'bk2a', 'bk2a'] }],
    activePatternId: 'pk2', periodPatterns: [] },
  { id: 24, no: 3,  name: '木戸',       deptId: 'kitchen', active: true,  joinDate: '2024-01-01', leaveDate: '',
    timeBlocks: [{ id: 'bk3a', label: '木戸_夜', short: '夜', inH: 21, inM: 0, outH: 9, outM: 0, colorIdx: 8 }],
    patterns: [{ id: 'pk3', label: '夜勤', colorIdx: 8, days: ['bk3a', 'off1', 'bk3a', 'bk3a', 'bk3a', 'bk3a', 'bk3a'] }],
    activePatternId: 'pk3', periodPatterns: [] },
  { id: 25, no: 4,  name: '木戸Jr',     deptId: 'kitchen', active: true,  joinDate: '2024-01-01', leaveDate: '', timeBlocks: [], patterns: [], activePatternId: null, periodPatterns: [] },
]
