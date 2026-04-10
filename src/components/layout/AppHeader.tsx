import { useShiftStore } from '@/store/useShiftStore'
import { DbStatusBadge } from './DbStatusBadge'
import { JP_WD } from '@/lib/constants'

export function AppHeader() {
  const {
    view, setView,
    viewMode, setViewMode,
    weekStart, prevWeek, nextWeek,
    year, month, prevMonth, nextMonth,
    dbStatus, setShowPrint, setShowManual,
  } = useShiftStore()

  const isGrid = view === 'grid'

  const dateLabel = viewMode === 'weekly'
    ? (() => {
        const end = new Date(weekStart); end.setDate(end.getDate() + 6)
        const m = weekStart.getMonth() + 1, d = weekStart.getDate()
        const em = end.getMonth() + 1, ed = end.getDate()
        return `${weekStart.getFullYear()}/${m}/${d}（${JP_WD[weekStart.getDay()]}）〜 ${em !== m ? `${em}/` : ''}${ed}（${JP_WD[end.getDay()]}）`
      })()
    : `${year}年${month + 1}月`

  const onPrev = () => viewMode === 'weekly' ? prevWeek() : prevMonth()
  const onNext = () => viewMode === 'weekly' ? nextWeek() : nextMonth()

  return (
    <header style={{
      background: '#0f2044', padding: '0 20px',
      display: 'flex', alignItems: 'center', gap: 10,
      height: 52, position: 'sticky', top: 0, zIndex: 200,
      boxShadow: '0 2px 14px rgba(0,0,0,.3)',
    }}>
      {/* Logo */}
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 17, color: '#c9a84c', letterSpacing: '.05em', flexShrink: 0 }}>
        SHIFT<span style={{ color: '#fff' }}>MGR</span>
      </div>

      {/* Hotel name */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.85)', letterSpacing: '.03em', fontFamily: "'Noto Sans JP',sans-serif", borderLeft: '1.5px solid rgba(255,255,255,.2)', paddingLeft: 12, flexShrink: 0 }}>
        HOTEL ELDIA <span style={{ color: '#c9a84c' }}>神戸店</span>
      </div>

      {/* Main tabs */}
      <div style={{ display: 'flex', gap: 3 }}>
        {([['grid', 'シフト表'], ['summary', '集計'], ['settings', '設定']] as const).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              background: view === v ? '#c9a84c' : 'rgba(255,255,255,.1)',
              border: 'none', color: view === v ? '#0f2044' : 'rgba(255,255,255,.6)',
              padding: '5px 14px', borderRadius: 16, cursor: 'pointer',
              fontSize: 12.5, fontFamily: "'Noto Sans JP',sans-serif",
              fontWeight: view === v ? 700 : 400, transition: 'all .15s',
            }}
          >{l}</button>
        ))}
      </div>

      {/* Week/Month toggle (only for grid view) */}
      {isGrid && (
        <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,.1)', padding: 3, borderRadius: 10 }}>
          {(['weekly', 'monthly'] as const).map((m, i) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              style={{
                background: viewMode === m ? '#fff' : 'transparent',
                border: 'none', color: viewMode === m ? '#0f2044' : 'rgba(255,255,255,.6)',
                padding: '4px 12px', borderRadius: 7, cursor: 'pointer',
                fontSize: 12, fontFamily: "'Noto Sans JP',sans-serif",
                fontWeight: 600, transition: 'all .15s',
              }}
            >{i === 0 ? '週' : '月'}</button>
          ))}
        </div>
      )}

      {/* Navigation */}
      {(isGrid || view === 'summary') && (
        <>
          <button onClick={onPrev} style={{ background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 15 }}>‹</button>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', fontFamily: "'Noto Sans JP',sans-serif", whiteSpace: 'nowrap', minWidth: 120, textAlign: 'center' }}>
            {isGrid ? dateLabel : `${year}年${month + 1}月`}
          </span>
          <button onClick={onNext} style={{ background: 'rgba(255,255,255,.12)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 15 }}>›</button>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* DB status */}
      <DbStatusBadge status={dbStatus} />

      {/* Print button */}
      {isGrid && (
        <button
          onClick={() => setShowPrint(true)}
          style={{ background: 'rgba(255,255,255,.12)', border: 'none', color: 'rgba(255,255,255,.8)', padding: '4px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11.5, fontFamily: "'Noto Sans JP',sans-serif" }}
        >🖨</button>
      )}

      {/* Manual button */}
      <button
        onClick={() => setShowManual(true)}
        style={{ background: 'rgba(255,255,255,.12)', border: 'none', color: 'rgba(255,255,255,.8)', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
      >❓</button>
    </header>
  )
}
