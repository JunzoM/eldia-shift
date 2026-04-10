import type { DbStatus } from '@/types'

const STATUS_CONFIG: Record<DbStatus, { color: string; label: string }> = {
  init:    { color: '#94a3b8', label: '初期化中' },
  loading: { color: '#94a3b8', label: '読込中' },
  saving:  { color: '#f59e0b', label: '保存中' },
  ok:      { color: '#10b981', label: '保存済' },
  offline: { color: '#ef4444', label: 'オフライン' },
}

export function DbStatusBadge({ status }: { status: DbStatus }) {
  const { color, label } = STATUS_CONFIG[status]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,.7)' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      {label}
    </div>
  )
}
