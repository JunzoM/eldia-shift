import { useRef, useState } from 'react'
import { useShiftStore } from '@/store/useShiftStore'
import { INIT_DEPTS, PALETTE } from '@/lib/constants'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StaffCard } from './StaffCard'

type SectionTab = 'timeblocks' | 'patterns' | 'periodpatterns'

export function StaffList() {
  const {
    staff, addingStaff, setAddingStaff,
    newStaff, setNewStaff, addStaff,
    openStaffId, setOpenStaffId,
  } = useShiftStore()
  const dragStaffId = useRef<number | null>(null)
  const [sectionTabs, setSectionTabs] = useState<Record<number, SectionTab>>({})

  function getSectionTab(staffId: number): SectionTab {
    return sectionTabs[staffId] || 'patterns'
  }
  function setSectionTab(staffId: number, tab: SectionTab) {
    setSectionTabs(p => ({ ...p, [staffId]: tab }))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>スタッフを選んで個人設定・週間パターンを管理</span>
        <Button variant="gold" size="sm" style={{ marginLeft: 'auto' }} onClick={() => setAddingStaff(!addingStaff)}>＋ スタッフ追加</Button>
      </div>

      {addingStaff && (
        <div style={{ background: '#fff', borderRadius: 9, border: '1.5px dashed #dde3ef', padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            placeholder="氏名 *"
            value={newStaff.name}
            onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && addStaff()}
            autoFocus
            style={{ width: 130 }}
          />
          <select value={newStaff.deptId} onChange={e => setNewStaff({ ...newStaff, deptId: e.target.value as typeof newStaff.deptId })} style={{ border: '1.5px solid #dde3ef', borderRadius: 6, padding: '5px 10px', fontSize: 13, outline: 'none', background: '#f8faff', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
            {INIT_DEPTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
          <Button variant="gold" size="sm" onClick={addStaff}>追加</Button>
          <Button variant="secondary" size="sm" onClick={() => setAddingStaff(false)}>キャンセル</Button>
        </div>
      )}

      {INIT_DEPTS.map(dept => {
        const deptStaff = staff.filter(s => s.deptId === dept.id).sort((a, b) => a.no - b.no)
        if (deptStaff.length === 0) return null
        const dc = PALETTE[dept.colorIdx]
        return (
          <div key={dept.id} style={{ marginBottom: 18 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: dc.color, background: dc.bg, padding: '3px 12px', borderRadius: 8, border: `1px solid ${dc.color}`, display: 'inline-block', marginBottom: 8 }}>
              {dept.label}
            </span>
            {deptStaff.map(s => (
              <StaffCard
                key={s.id}
                s={s}
                isOpen={openStaffId === s.id}
                sectionTab={getSectionTab(s.id)}
                onToggle={() => setOpenStaffId(openStaffId === s.id ? null : s.id)}
                onSectionChange={tab => setSectionTab(s.id, tab)}
                dragStaffId={dragStaffId}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
