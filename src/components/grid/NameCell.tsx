import type { Staff } from '@/types'
import { PALETTE } from '@/lib/constants'
import { useShiftStore } from '@/store/useShiftStore'

interface Props {
  s: Staff
}

export function NameCell({ s }: Props) {
  const { updateStaff, setView, setSettingsTab, setOpenStaffId } = useShiftStore()

  const ap = s.activePatternId ? s.patterns.find(p => p.id === s.activePatternId) : null
  const pc = ap ? PALETTE[ap.colorIdx] : null

  return (
    <td className="td-name">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '3px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>{s.name}</span>
        </div>
        {s.active && (
          s.patterns.length > 0 ? (
            <select
              value={s.activePatternId || ''}
              onChange={e => updateStaff(s.id, p => ({ ...p, activePatternId: e.target.value || null }))}
              style={{
                fontSize: 9.5,
                border: `1px solid ${pc ? pc.color : '#dde3ef'}`,
                borderRadius: 4, padding: '1px 4px',
                background: pc ? pc.bg : '#f8faff',
                color: pc ? pc.color : '#64748b',
                outline: 'none', cursor: 'pointer', maxWidth: 100,
                fontFamily: "'Noto Sans JP',sans-serif",
              }}
            >
              {s.patterns.map(p => (
                <option key={p.id} value={p.id}>
                  {p.label}{p.activeFrom ? ` (${p.activeFrom}〜)` : ' (デフォルト)'}
                </option>
              ))}
            </select>
          ) : (
            <span
              onClick={() => { setView('settings'); setSettingsTab('staff'); setOpenStaffId(s.id) }}
              style={{ fontSize: 9.5, color: '#94a3b8', cursor: 'pointer', borderBottom: '1px dashed #cbd5e1' }}
            >＋ パターン</span>
          )
        )}
        {s.timeBlocks.length > 0 && (
          <span
            onClick={() => { setView('settings'); setSettingsTab('staff'); setOpenStaffId(s.id) }}
            style={{ fontSize: 8.5, color: '#0f766e', cursor: 'pointer', background: '#ccfbf1', padding: '0 4px', borderRadius: 3, display: 'inline-block', width: 'fit-content' }}
          >
            ⏱ {s.timeBlocks.length}件の個人設定
          </span>
        )}
      </div>
    </td>
  )
}
