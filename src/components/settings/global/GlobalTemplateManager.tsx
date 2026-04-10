import { useState } from 'react'
import { useShiftStore } from '@/store/useShiftStore'
import type { TimeBlock } from '@/types'
import { TimeBlockForm } from '@/components/shared/TimeBlockForm'
import { TimeBlockCard } from '@/components/shared/TimeBlockCard'

export function GlobalTemplateManager() {
  const { globalTemplates, setGlobalTemplates } = useShiftStore()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function save(block: TimeBlock) {
    setGlobalTemplates(editingId
      ? globalTemplates.map(t => t.id === editingId ? block : t)
      : [...globalTemplates, block]
    )
    setCreating(false); setEditingId(null)
  }

  const editTarget = editingId ? globalTemplates.find(t => t.id === editingId) : null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 8 }}>
        <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.6, flex: 1 }}>
          全スタッフが共通で使える時間テンプレートです。週間パターン作成時にすぐ選べます。
        </p>
        {!creating && !editingId && (
          <button className="btn gold sm" onClick={() => { setCreating(true); setEditingId(null) }}>＋ 追加</button>
        )}
      </div>

      {(creating || editTarget) && (
        <TimeBlockForm
          initial={editTarget || null}
          title={editTarget ? '共通テンプレートを編集' : '共通テンプレートを追加'}
          onSave={save}
          onCancel={() => { setCreating(false); setEditingId(null) }}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
        {globalTemplates.map(t => (
          <TimeBlockCard
            key={t.id}
            block={t}
            onEdit={() => { setEditingId(t.id); setCreating(false) }}
            onDelete={() => setGlobalTemplates(globalTemplates.filter(x => x.id !== t.id))}
          />
        ))}
        {!creating && !editingId && (
          <div
            onClick={() => setCreating(true)}
            style={{ border: '2px dashed rgba(201,168,76,.35)', borderRadius: 10, background: 'rgba(255,255,255,.5)', backdropFilter: 'blur(8px)', minHeight: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', gap: 4, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,.7)'; e.currentTarget.style.background = 'rgba(255,255,255,.7)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,.35)'; e.currentTarget.style.background = 'rgba(255,255,255,.5)' }}
          >
            <span style={{ fontSize: 22 }}>＋</span>
            <span style={{ fontSize: 11.5, fontWeight: 600 }}>追加</span>
          </div>
        )}
      </div>
    </div>
  )
}
