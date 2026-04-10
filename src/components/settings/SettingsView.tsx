import { useShiftStore } from '@/store/useShiftStore'
import { StaffList } from './staff/StaffList'
import { GlobalTemplateManager } from './global/GlobalTemplateManager'

export function SettingsView() {
  const { settingsTab, setSettingsTab } = useShiftStore()

  return (
    <div>
      <div className="sub-tabs">
        <button className={`sub-tab${settingsTab === 'staff' ? ' on' : ''}`} onClick={() => setSettingsTab('staff')}>👤 スタッフ</button>
        <button className={`sub-tab${settingsTab === 'global' ? ' on' : ''}`} onClick={() => setSettingsTab('global')}>🌐 共通テンプレート</button>
      </div>

      {settingsTab === 'staff' && <StaffList />}
      {settingsTab === 'global' && (
        <div>
          <GlobalTemplateManager />
        </div>
      )}
    </div>
  )
}
