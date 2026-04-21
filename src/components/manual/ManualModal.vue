<template>
  <BaseModal v-model="ui.showManual" widthClass="md:max-w-2xl">
    <div class="flex items-center justify-between px-4 py-3 border-b border-brand-border">
      <div class="text-sm font-bold text-brand-text">使い方マニュアル</div>
      <button class="text-brand-muted hover:text-brand-text transition-colors" @click="ui.showManual = false">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <div class="overflow-y-auto flex-1 p-4 space-y-6 text-sm">
      <section v-for="sec in sections" :key="sec.title">
        <h3 class="font-bold text-brand-text mb-2 flex items-center gap-2">
          <span class="text-brand-accent">{{ sec.icon }}</span>
          {{ sec.title }}
        </h3>
        <div class="text-brand-muted leading-relaxed space-y-1" v-html="sec.content" />
      </section>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { useUIStore } from '@/stores/useUIStore'
import BaseModal from '@/components/shared/BaseModal.vue'

const ui = useUIStore()

const sections = [
  {
    icon: '📋',
    title: 'シフト表の見方',
    content: `
      <p>メインの「シフト表」タブで月間・週間のシフトを確認できます。</p>
      <p>週 / 月 ボタンで表示期間を切り替え、← → ボタンで前後に移動します。</p>
    `,
  },
  {
    icon: '✏️',
    title: 'シフトを入力する',
    content: `
      <p>右上の🔓ボタンでロックを解除すると、セルをクリックしてシフトを設定できます。</p>
      <p>ポップアップから時間テンプレートを選択、または直接時間を入力します。</p>
      <p>オレンジ色の点は手動入力済みのセルを示します。「クリア」で自動判定に戻ります。</p>
    `,
  },
  {
    icon: '🗂️',
    title: 'テンプレートとパターン',
    content: `
      <p><strong>個人テンプレート:</strong> スタッフ固有の勤務時間帯を登録します。</p>
      <p><strong>週間パターン:</strong> 曜日ごとのシフトを設定し、自動的に適用されます。</p>
      <p><strong>期間パターン:</strong> GWや年末年始など特定期間の特別シフトを設定します。</p>
      <p><strong>共通テンプレート:</strong> 全スタッフが共有できる時間テンプレートです。</p>
    `,
  },
  {
    icon: '👥',
    title: 'スタッフ管理',
    content: `
      <p>「設定」タブでスタッフの追加・編集・削除が行えます。</p>
      <p>ドラッグ&ドロップで同部門内の並び順を変更できます。</p>
      <p>退職日を設定すると、退職月まで表示され翌月以降は非表示になります。</p>
    `,
  },
  {
    icon: '📊',
    title: '集計',
    content: `
      <p>「集計」タブで月間の勤務日数・総時間・実働時間（休憩控除後）を確認できます。</p>
      <p>休憩控除: 4.5時間以上は0.5時間、6.5時間以上は1時間を控除します。</p>
    `,
  },
  {
    icon: '🖨️',
    title: '印刷',
    content: `
      <p>ヘッダーの印刷ボタンから印刷フォーマットを選択して印刷できます。</p>
      <p>週次・月次、縦・横の各フォーマットに対応しています。</p>
    `,
  },
  {
    icon: '💾',
    title: 'データ保存',
    content: `
      <p>変更は1.2秒後に自動的にクラウド（Supabase）に保存されます。</p>
      <p>右上のステータスインジケーターで保存状況を確認できます。</p>
      <p>オフラインモードでは変更がリロード時に失われます。</p>
    `,
  },
]
</script>
