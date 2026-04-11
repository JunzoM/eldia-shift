import { useState, useMemo } from 'react'
import { useShiftStore } from '@/store/useShiftStore'
import { INIT_DEPTS, JP_WD, OFF_BLOCKS } from '@/lib/constants'

// OFF_BLOCKSのIDを定数として参照（ハードコード排除）
const ID_YUKYU = OFF_BLOCKS.find(b => b.id === 'off2')!.id   // 有休
const ID_TOKKETSU = OFF_BLOCKS.find(b => b.id === 'off3')!.id // 当欠
const deptLabel = (id: string) => INIT_DEPTS.find(d => d.id === id)?.label ?? id
import { getDays, getWeekDates, calcH, calcNetH, findBlock, isToday, toDateStr } from '@/lib/utils'

interface Props { onClose: () => void }

export function PrintModal({ onClose }: Props) {
  const { staff, globalTemplates, year, month, weekStart, viewMode, getEffective } = useShiftStore()

  const [fmt, setFmt] = useState('weekly-dept')
  const [halfSel, setHalfSel] = useState<'both' | 'first' | 'second'>('both')
  const [deptSel, setDeptSel] = useState({ make: true, kitchen: true, front: true })

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const monthDates = useMemo(() =>
    Array.from({ length: getDays(year, month) }, (_, i) => new Date(year, month, i + 1)),
    [year, month]
  )

  const dates = fmt.includes('weekly') ? weekDates : monthDates
  const isLS = fmt.includes('landscape') || fmt === 'monthly-front-ls'
  const cellW = isLS ? '17pt' : '21pt'
  const nameW = isLS ? '42pt' : '46pt'
  const fsTime = isLS ? '7pt' : '7.5pt'

  const staffByDept = useMemo(() =>
    INIT_DEPTS.map(d => ({
      ...d,
      members: staff.filter(s => s.deptId === d.id && s.active).sort((a, b) => a.no - b.no),
    })),
    [staff]
  )

  const summary = useMemo(() => staff.map(s => {
    let totalH = 0
    monthDates.forEach(d => {
      if (s.leaveDate && toDateStr(d) >= s.leaveDate) return
      const eff = getEffective(s, d)
      if (!eff || eff.isOff) return
      if (eff.inTime && eff.outTime) {
        const [ih, im] = eff.inTime.split(':').map(Number)
        const [oh, om] = eff.outTime.split(':').map(Number)
        totalH += calcNetH(calcH(ih, im, oh, om))
      }
    })
    return { id: s.id, totalH: +totalH.toFixed(1) }
  }), [staff, year, month])

  const weekLabel = weekDates.length > 0
    ? `${weekDates[0].getMonth() + 1}/${weekDates[0].getDate()}〜${weekDates[6].getMonth() + 1}/${weekDates[6].getDate()}`
    : ''

  const half1 = monthDates.slice(0, 15)
  const half2 = monthDates.slice(15)
  const selectedChunks = halfSel === 'first' ? [half1] : halfSel === 'second' ? [half2] : [half1, half2]
  const selDepts = (Object.entries(deptSel) as [string, boolean][]).filter(([, v]) => v).map(([k]) => k)

  function doPrint() {
    const pw = document.getElementById('__pw__')
    if (!pw) return
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { alert('ポップアップをブロックしています。ブラウザの設定を確認してください。'); return }
    const pageSize = isLS ? 'A4 landscape' : 'A4 portrait'
    win.document.write(`<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>シフト表</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=DM+Sans:wght@400;600;700&display=swap">
<style>
@page { size: ${pageSize}; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { background: #fff; font-family: 'Noto Sans JP', sans-serif; }
table { border-collapse: collapse; }
</style>
</head>
<body>
${pw.innerHTML}
</body>
</html>`)
    win.document.close()
    win.onload = function () {
      setTimeout(() => { win.print(); setTimeout(() => win.close(), 1000) }, 800)
    }
    setTimeout(() => {
      if (!win.closed) { win.print(); setTimeout(() => win.close(), 1000) }
    }, 2000)
  }

  function PageHdr({ label }: { label: string }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4pt', borderBottom: '0.5pt solid #ccc', paddingBottom: '3pt' }}>
        <span style={{ flex: 1, fontSize: '9.5pt', fontWeight: 700, color: '#000' }}>{label}</span>
        <span style={{ flex: 1, textAlign: 'center', fontSize: '11pt', fontWeight: 900, color: '#000', letterSpacing: '.05em' }}>HOTEL ELDIA 神戸店</span>
        <span style={{ flex: 1, textAlign: 'right', fontSize: '6.5pt', color: '#555' }}>出力日: {new Date().toLocaleDateString('ja-JP')}</span>
      </div>
    )
  }

  function PT({ ptDates, deptIds = null }: { ptDates: Date[], deptIds?: string[] | null }) {
    const fs = isLS ? '7.5pt' : '8pt'
    return (
      <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed', fontSize: fs }}>
        <thead>
          <tr>
            <th style={{ background: '#000', color: '#fff', padding: '4pt 2pt', width: '14pt', fontSize: '7pt', border: '0.5pt solid #000', textAlign: 'center' }}>No</th>
            <th style={{ background: '#000', color: '#fff', padding: '4pt 4pt', width: nameW, textAlign: 'center', border: '0.5pt solid #000', fontWeight: 700 }}>氏名</th>
            <th style={{ background: '#333', color: '#fff', padding: '1pt', width: '10pt', border: '0.5pt solid #000', fontSize: '5pt' }}>
              <div style={{ display: 'flex', flexDirection: 'column', fontWeight: 900, gap: '1pt', alignItems: 'center' }}>
                <span>入</span><span>出</span>
              </div>
            </th>
            {ptDates.map(d => {
              const dow = d.getDay()
              const tod = isToday(d)
              const isSun = dow === 0, isSat = dow === 6
              return (
                <th key={d.toISOString()} style={{
                  padding: '3pt 0', textAlign: 'center',
                  background: tod ? '#000' : isSun ? '#555' : isSat ? '#888' : '#000',
                  color: '#fff', fontSize: '8pt', fontWeight: 700,
                  border: '0.5pt solid #000', width: cellW,
                  borderBottom: isSun || isSat ? '2pt solid #fff' : '0.5pt solid #000',
                }}>
                  <div style={{ fontWeight: 900 }}>{viewMode === 'weekly' ? `${d.getMonth() + 1}/${d.getDate()}` : d.getDate()}</div>
                  <div style={{ fontSize: '6.5pt', opacity: .85 }}>{isSun ? '㊐' : isSat ? '㊏' : JP_WD[dow]}</div>
                </th>
              )
            })}
            <th style={{ background: '#000', color: '#fff', padding: '4pt 2pt', width: '24pt', fontSize: '7pt', borderLeft: '1.5pt solid #000', border: '0.5pt solid #000', textAlign: 'center' }}>計</th>
          </tr>
        </thead>
        <tbody>
          {staffByDept.filter(dept => !deptIds || deptIds.includes(dept.id)).map(dept => {
            if (dept.members.length === 0) return null
            return [
              <tr key={`d-${dept.id}`}>
                <td colSpan={ptDates.length + 4} style={{
                  padding: '4pt 5pt', fontSize: '8.5pt', fontWeight: 900,
                  background: '#e8e8e8', color: '#000',
                  borderLeft: '3pt solid #000',
                  borderTop: '1pt solid #000', borderBottom: '1pt solid #000',
                  letterSpacing: '.06em',
                }}>■ {dept.label}</td>
              </tr>,
              ...dept.members.map(s => {
                const sm = summary.find(x => x.id === s.id)
                return (
                  <tr key={s.id} style={{ background: '#fff', borderTop: '1pt solid #555', borderBottom: '1pt solid #555' }}>
                    <td style={{ textAlign: 'center', fontSize: '7pt', color: '#555', border: '0.5pt solid #555', padding: '5pt 1pt', background: '#fff' }}>{s.no}</td>
                    <td style={{ padding: '5pt 2pt', fontWeight: 700, fontSize: '9pt', textAlign: 'center', border: '0.5pt solid #ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: '#fff' }}>{s.name}</td>
                    <td style={{ border: '0.5pt solid #555', padding: 0, background: '#ebebeb' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '6.5pt', fontWeight: 900, alignItems: 'center' }}>
                        <span style={{ padding: '3pt 2pt', borderBottom: '0.3pt solid #bbb' }}>入</span>
                        <span style={{ padding: '3pt 2pt' }}>出</span>
                      </div>
                    </td>
                    {ptDates.map(d => {
                      const afterLeave = s.leaveDate ? toDateStr(d) >= s.leaveDate : false
                      const eff = afterLeave ? null : getEffective(s, d)
                      const b = eff?.blockId ? findBlock(eff.blockId, s.timeBlocks, globalTemplates) : null
                      const dow = d.getDay()
                      const isSun = dow === 0, isSat = dow === 6
                      const cellBg = afterLeave
                        ? '#c8c8c8'
                        : eff?.isOff
                          ? '#e8e8e8'
                          : isSun ? '#d0d0d0'
                          : isSat ? '#e0e0e0'
                          : '#fff'
                      return (
                        <td key={d.toISOString()} style={{
                          padding: 0,
                          background: cellBg,
                          border: `0.5pt solid ${isSun || isSat ? '#555' : '#888'}`,
                          borderLeft: isSun ? '1pt solid #333' : isSat ? '0.5pt solid #555' : '0.5pt solid #888',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                        }}>
                          {afterLeave ? (
                            <div style={{ fontSize: '7pt', color: '#999', textAlign: 'center', lineHeight: 1 }}>×</div>
                          ) : eff?.isOff ? (
                            b?.id === ID_YUKYU ? (
                              <div style={{ fontSize: '8pt', fontWeight: 900, color: '#000', border: '1pt solid #000', margin: '1pt auto', width: '10pt', height: '10pt', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>有</div>
                            ) : b?.id === ID_TOKKETSU ? (
                              <div style={{ fontSize: '8pt', fontWeight: 900, color: '#000', border: '1pt solid #000', margin: '1pt auto', width: '10pt', height: '10pt', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>欠</div>
                            ) : null
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', fontSize: fsTime, fontFamily: 'monospace', fontWeight: 700, lineHeight: 1.6 }}>
                              <span style={{ padding: '2pt 0', borderBottom: '0.3pt solid #bbb', color: '#000' }}>{eff?.inTime ? eff.inTime.replace(/^0/, '') : ''}</span>
                              <span style={{ padding: '2pt 0', color: '#000' }}>{eff?.outTime ? eff.outTime.replace(/^0/, '') : ''}</span>
                            </div>
                          )}
                        </td>
                      )
                    })}
                    <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 900, fontSize: '7.5pt', color: '#000', background: '#e8e8e8', borderLeft: '1.5pt solid #000', border: '0.5pt solid #555', padding: '5pt 1pt' }}>
                      {sm ? `${sm.totalH}h` : ''}
                    </td>
                  </tr>
                )
              }),
            ]
          })}
        </tbody>
      </table>
    )
  }

  const printContent = fmt === 'weekly-dept' ? (
    <>
      {selDepts.map(did => {
        const dlabel = deptLabel(did)
        return (
          <div key={did} style={{ width: '210mm', minHeight: '297mm', padding: '7mm', background: '#fff', pageBreakAfter: 'always', boxSizing: 'border-box', fontFamily: "'Noto Sans JP',sans-serif" }}>
            <PageHdr label={`${weekDates[0]?.getFullYear()}年 シフト表　${dlabel}　${weekLabel}`} />
            <PT ptDates={weekDates} deptIds={[did]} />
          </div>
        )
      })}
    </>
  ) : fmt === 'monthly-dept-v' ? (
    <>
      {selDepts.map(did => {
        const dlabel = deptLabel(did)
        return selectedChunks.map((chunk, ci) => (
          <div key={`${did}-${ci}`} style={{ width: '210mm', minHeight: '297mm', padding: '7mm', background: '#fff', pageBreakAfter: 'always', boxSizing: 'border-box', fontFamily: "'Noto Sans JP',sans-serif" }}>
            <PageHdr label={`${year}年 ${month + 1}月 シフト表　${dlabel}　${chunk[0].getDate()}日〜${chunk[chunk.length - 1].getDate()}日`} />
            <PT ptDates={chunk} deptIds={[did]} />
          </div>
        ))
      })}
    </>
  ) : fmt === 'monthly-makekitchen' ? (
    <>
      {selectedChunks.map((chunk, ci) => (
        <div key={ci} style={{ width: '210mm', minHeight: '297mm', padding: '7mm', background: '#fff', pageBreakAfter: 'always', boxSizing: 'border-box', fontFamily: "'Noto Sans JP',sans-serif" }}>
          <PageHdr label={`${year}年 ${month + 1}月 シフト表　メイク・キッチン　${chunk[0].getDate()}日〜${chunk[chunk.length - 1].getDate()}日`} />
          <PT ptDates={chunk} deptIds={['make', 'kitchen']} />
        </div>
      ))}
    </>
  ) : fmt === 'monthly-front-ls' ? (
    <div style={{ width: '297mm', minHeight: '210mm', padding: '6mm', background: '#fff', boxSizing: 'border-box', fontFamily: "'Noto Sans JP',sans-serif" }}>
      <PageHdr label={`${year}年 ${month + 1}月 シフト表　フロント`} />
      <div style={{ marginBottom: '4pt', fontSize: '7pt', fontWeight: 700, color: '#555' }}>前半（1〜{half1[half1.length - 1]?.getDate()}日）</div>
      <PT ptDates={half1} deptIds={['front']} />
      <div style={{ marginTop: '6pt', marginBottom: '4pt', fontSize: '7pt', fontWeight: 700, color: '#555', borderTop: '0.5pt solid #ccc', paddingTop: '4pt' }}>後半（{half2[0]?.getDate()}〜{half2[half2.length - 1]?.getDate()}日）</div>
      <PT ptDates={half2} deptIds={['front']} />
    </div>
  ) : (
    // weekly landscape fallback
    <div style={{ width: '297mm', minHeight: '210mm', padding: '6mm', background: '#fff', boxSizing: 'border-box', fontFamily: "'Noto Sans JP',sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4pt', borderBottom: '0.5pt solid #ccc', paddingBottom: '3pt' }}>
        <span style={{ flex: 1, fontSize: '9.5pt', fontWeight: 700, color: '#000' }}>{weekDates[0]?.getFullYear()}年 シフト表　{weekLabel}</span>
        <span style={{ flex: 1, textAlign: 'center', fontSize: '10pt', fontWeight: 900, color: '#000', letterSpacing: '.05em' }}>HOTEL ELDIA 神戸店</span>
        <span style={{ flex: 1, textAlign: 'right', fontSize: '6.5pt', color: '#555' }}>出力日: {new Date().toLocaleDateString('ja-JP')}</span>
      </div>
      <PT ptDates={weekDates} deptIds={selDepts} />
    </div>
  )

  const SW = isLS ? 297 : 210
  const SH = isLS ? 210 : 297
  const SC = isLS ? 0.38 : 0.45

  return (
    <>
      <div id="__pw__" style={{ display: 'none', fontFamily: "'Noto Sans JP',sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=DM+Sans:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}table{border-collapse:collapse}`}</style>
        {printContent}
      </div>

      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div style={{ background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,.9)', borderRadius: 16, padding: 24, width: 660, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7), 0 24px 60px rgba(15,32,68,.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0f2044' }}>🖨 印刷・PDF出力</div>
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer' }}>×</button>
          </div>

          {/* Format selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {([
              ['weekly-dept', '📄', '週表示 A4縦（部門別）', '選択部門ごとに1枚'],
              ['monthly-dept-v', '📄', '月表示 A4縦（部門別）', '選択部門×半月'],
              ['monthly-makekitchen', '📄', '月表示 A4縦（メイク・厨房）', '2部門まとめて半月×2枚'],
              ['monthly-front-ls', '📋', '月表示 A4横（フロント）', '上=前半・下=後半 1枚'],
            ] as const).map(([v, ic, l, s]) => (
              <button key={v} onClick={() => setFmt(v)} style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                fontFamily: "'Noto Sans JP',sans-serif", fontSize: 12.5, fontWeight: 700,
                border: `2px solid ${fmt === v ? '#c9a84c' : '#dde3ef'}`,
                background: fmt === v ? '#fffbf0' : '#fff',
                color: fmt === v ? '#0f2044' : '#64748b',
                display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
              }}>
                <span style={{ fontSize: 22 }}>{ic}</span>
                <div><div>{l}</div><div style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8' }}>{s}</div></div>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div style={{ background: '#e2e8f0', borderRadius: 8, padding: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>プレビュー</div>
            <div style={{ overflow: 'hidden', height: SH * SC, width: SW * SC, border: '1px solid #cbd5e1', borderRadius: 3, background: '#fff' }}>
              <div style={{ width: SW, height: SH, transform: `scale(${SC})`, transformOrigin: 'top left', fontFamily: "'Noto Sans JP',sans-serif", pointerEvents: 'none' }}>
                {printContent}
              </div>
            </div>
          </div>

          {/* Department selection */}
          {(fmt === 'weekly-dept' || fmt === 'monthly-dept-v') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 14px', background: '#f8faff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f2044', flexShrink: 0 }}>部門選択：</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {([['make', 'メイク'], ['kitchen', 'キッチン'], ['front', 'フロント']] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setDeptSel(p => ({ ...p, [id]: !p[id] }))} style={{
                    padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
                    border: `1.5px solid ${deptSel[id] ? '#0f2044' : '#dde3ef'}`,
                    background: deptSel[id] ? '#0f2044' : '#fff',
                    color: deptSel[id] ? '#fff' : '#475569',
                    fontSize: 12, fontWeight: deptSel[id] ? 700 : 400,
                    fontFamily: "'Noto Sans JP',sans-serif", transition: 'all .15s',
                  }}>{label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Half selector */}
          {(fmt.includes('monthly') && fmt !== 'monthly-front-ls') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 14px', background: '#f8faff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f2044', flexShrink: 0 }}>印刷範囲：</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {([['both', '前半+後半（両方）'], ['first', '前半のみ（1〜15日）'], ['second', '後半のみ（16日〜末日）']] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setHalfSel(v)} style={{
                    padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
                    border: `1.5px solid ${halfSel === v ? '#0f2044' : '#dde3ef'}`,
                    background: halfSel === v ? '#0f2044' : '#fff',
                    color: halfSel === v ? '#fff' : '#475569',
                    fontSize: 12, fontWeight: halfSel === v ? 700 : 400,
                    fontFamily: "'Noto Sans JP',sans-serif", transition: 'all .15s',
                  }}>{l}</button>
                ))}
              </div>
            </div>
          )}

          {/* Print tips */}
          <div style={{ background: '#f8faff', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#475569', lineHeight: 1.8 }}>
            <strong style={{ color: '#0f2044' }}>印刷のヒント</strong><br />
            ・余白「なし」推奨　・「背景グラフィックを印刷する」ON
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ background: '#fff', color: '#0f2044', border: '1.5px solid #dde3ef', padding: '9px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}>キャンセル</button>
            <button onClick={doPrint} style={{ background: '#c9a84c', color: '#0f2044', border: 'none', padding: '9px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}>🖨 印刷 / PDF保存</button>
          </div>
        </div>
      </div>
    </>
  )
}
