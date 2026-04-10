import { useState } from 'react'
import type { Staff, TimeBlock } from '@/types'
import { useShiftStore } from '@/store/useShiftStore'
import { TimeBlockForm } from '@/components/shared/TimeBlockForm'
import { TimeBlockCard } from '@/components/shared/TimeBlockCard'

interface Props { s: Staff }

export function StaffTimeBlockManager({ s }: Props) {
  const { updateStaff } = useShiftStore()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function save(block: TimeBlock) {
    updateStaff(s.id, prev => ({
      ...prev,
      timeBlocks: editingId
        ? prev.timeBlocks.map(b => b.id === editingId ? block : b)
        : [...prev.timeBlocks, block],
    }))
    setCreating(false); setEditingId(null)
  }

  function del(id: string) {
    updateStaff(s.id, prev => ({ ...prev, timeBlocks: prev.timeBlocks.filter(b => b.id !== id) }))
  }

  const editTarget = editingId ? s.timeBlocks.find(b => b.id === editingId) : null

  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>個人専用 時間テンプレート</span>
        <span style={{ fontSize: 10.5, color: '#94a3b8', marginLeft: 6 }}>— この人だけが使えます</span>
        {!creating && !editingId && (
          <button className="btn gold sm" style={{ marginLeft: 'auto' }} onClick={() => { setCreating(true); setEditingId(null) }}>＋ 追加</button>
        )}
      </div>

      {(creating || editTarget) && (
        <TimeBlockForm
          initial={editTarget || null}
          title={`${s.name} の時間テンプレートを${editTarget ? '編集' : '作成'}`}
          onSave={save}
          onCancel={() => { setCreating(false); setEditingId(null) }}
        />
      )}

      {s.timeBlocks.length === 0 && !creating && (
        <div style={{ textAlign: 'center', padding: '14px 0', color: '#94a3b8', fontSize: 12.5, border: '1.5px dashed #e2e8f0', borderRadius: 8 }}>
          個人テンプレートなし — ＋ボタンで追加
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 8 }}>
        {s.timeBlocks.map(b => (
          <TimeBlockCard
            key={b.id}
            block={b}
            onEdit={() => { setEditingId(b.id); setCreating(false) }}
            onDelete={() => del(b.id)}
          />
        ))}
      </div>
    </div>
  )
}
