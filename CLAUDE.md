# ELDIA 設備管理システム — デザインシステム & 開発ガイド

## スタック

- **Vue 3** + TypeScript (Composition API `<script setup>`)
- **Tailwind CSS v3** (`darkMode: 'class'`)
- **Pinia** (状態管理)
- **Supabase** (DB・認証・リアルタイム)
- フォント: **Noto Sans JP** (sans) / **JetBrains Mono** (mono)

---

## カラーシステム

CSS変数でライト/ダークを切り替える。Tailwindクラスは `bg-brand-*` / `text-brand-*` / `border-brand-*` を使う。

### トークン一覧と用途

| トークン | ライト | ダーク | 用途 |
|---|---|---|---|
| `--brand-bg` | `#f5f5f5` | `#0f1117` | ページ背景 |
| `--brand-surface` | `#ffffff` | `#1a1d27` | カード・モーダル・サイドバー |
| `--brand-surface2` | `#e8e8ee` | `#232635` | 入力欄・ホバー背景・セカンダリ面 |
| `--brand-border` | `#c0c0c0` | `#2e3248` | 枠線全般 |
| `--brand-accent` | `#e11d48` | `#fb7185` | プライマリアクション・FAB・リンク |
| `--brand-text` | `#1a1614` | `#e8e2d4` | 本文・見出し |
| `--brand-muted` | `#6b6456` | `#7a7a8a` | サブテキスト・プレースホルダー |
| `--brand-red` | `#c0212e` | `#ff5f6d` | エラー・未対応ステータス |
| `--brand-yellow` | `#9c6d00` | `#ffc048` | 警告・対応中ステータス |
| `--brand-green` | `#2d7a52` | `#4caf7d` | 成功・完了ステータス |
| `--header-bg` | `rgba(255,255,255,0.97)` | `rgba(15,17,23,0.97)` | ヘッダー・フッターの backdrop |

### ダークモード実装

```ts
// src/composables/useTheme.ts
import { ref, watchEffect } from 'vue'

const isDark = ref(localStorage.getItem('theme') === 'dark')

watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
})

export function useTheme() {
  return {
    isDark,
    toggleTheme: () => { isDark.value = !isDark.value },
  }
}
```

`App.vue` の `setup()` で `useTheme()` を呼ぶだけで有効になる。

---

## tailwind.config.js

```js
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:      'var(--brand-bg)',
          surface: 'var(--brand-surface)',
          surface2:'var(--brand-surface2)',
          border:  'var(--brand-border)',
          accent:  'var(--brand-accent)',
          text:    'var(--brand-text)',
          muted:   'var(--brand-muted)',
          red:     'var(--brand-red)',
          yellow:  'var(--brand-yellow)',
          green:   'var(--brand-green)',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
}
```

---

## UIコンポーネントパターン

### カード

```html
<div class="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-sm dark:shadow-none">
  ...
</div>
```

状態によるカード色変化（例: 問題あり）:

```
未対応あり: border-red-400 bg-red-50 dark:border-red-500/60 dark:bg-red-500/5
対応中あり: border-amber-400 bg-amber-50 dark:border-yellow-500/50 dark:bg-yellow-500/5
正常:       border-brand-border bg-brand-surface hover:bg-brand-surface2
```

### ボタン

```html
<!-- プライマリ -->
<button class="px-4 py-2.5 rounded-xl bg-brand-accent text-white text-sm font-bold hover:opacity-90 active:scale-[.98] transition-all">
  送信
</button>

<!-- セカンダリ -->
<button class="px-4 py-2.5 rounded-xl border border-brand-border text-brand-muted text-sm font-bold hover:bg-brand-surface2 transition-colors">
  キャンセル
</button>

<!-- 危険（削除） -->
<button class="px-4 py-2.5 rounded-xl border border-brand-border text-red-400 text-sm font-bold hover:bg-red-500/10 transition-colors">
  🗑 削除
</button>

<!-- FAB（丸ボタン） -->
<button class="w-14 h-14 rounded-full bg-brand-accent text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"
  style="box-shadow: 0 4px 16px rgba(225,29,72,0.35)">
  <svg class="w-6 h-6" .../>
</button>

<!-- フィルターバッジ（選択式） -->
<button :class="[
  'text-xs font-bold px-2.5 py-1 rounded-full border transition-colors active:scale-95',
  isActive
    ? 'bg-brand-accent text-white border-brand-accent'
    : 'bg-brand-surface2 text-brand-muted border-brand-border hover:border-brand-accent hover:text-brand-text'
]">
  ラベル
</button>
```

### ステータスバッジ

```html
<!-- グローバルクラスとして定義済み (src/style.css) -->
<span class="status-badge-open">未対応</span>
<span class="status-badge-progress">対応中</span>
<span class="status-badge-done">完了</span>
```

定義:
```css
.status-badge-open     { @apply bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full; }
.status-badge-progress { @apply bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full; }
.status-badge-done     { @apply bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full; }
.dark .status-badge-open     { @apply bg-red-500/20 text-red-400; }
.dark .status-badge-progress { @apply bg-yellow-500/20 text-yellow-400; }
.dark .status-badge-done     { @apply bg-green-500/20 text-green-400; }
```

### 入力欄

```html
<input
  class="w-full bg-brand-surface2 border border-brand-border rounded-xl px-3 py-2 text-sm
         focus:outline-none focus:border-brand-accent transition-colors"
  placeholder="入力してください"
/>
```

### セクションラベル（サイドバー内等）

```html
<div class="text-[9px] font-bold text-brand-muted uppercase tracking-widest mb-2 px-1">
  セクション名
</div>
```

### フロア区切り

```html
<div class="text-[10px] font-bold text-brand-muted tracking-widest font-mono py-2.5">
  ── 5F ──
</div>
```

---

## レイアウトパターン

### PC + モバイル レイアウト（App.vue 基本構造）

```html
<div class="min-h-screen bg-brand-bg md:flex md:h-screen md:overflow-hidden">

  <!-- サイドバー (PC のみ) -->
  <aside class="hidden md:flex flex-col w-56 lg:w-60 border-r border-brand-border bg-brand-surface
                sticky top-0 h-screen overflow-y-auto flex-shrink-0">
    ...
  </aside>

  <!-- メインエリア -->
  <div class="flex-1 flex flex-col min-w-0 md:h-full md:overflow-hidden">
    <!-- ヘッダー (モバイル) -->
    <header class="md:hidden ...">...</header>

    <!-- コンテンツ -->
    <div class="flex-1 overflow-y-auto">...</div>

    <!-- フッタータブ (モバイル) -->
    <nav class="fixed bottom-0 left-0 right-0 md:hidden ...">...</nav>
  </div>
</div>
```

### モーダル (下から出るシート → PC では中央)

```html
<div class="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center"
     @click.self="emit('close')">
  <div class="w-full md:max-w-xl bg-brand-surface rounded-t-2xl md:rounded-2xl
              flex flex-col max-h-[88vh] overflow-hidden shadow-2xl">
    ...
  </div>
</div>
```

### フルスクリーンパネル (PC ではサイドバーの右に並ぶ 2 列目)

```html
<!-- モバイル: fixed full-screen / PC: flex の 2 列目として展開 -->
<div class="fixed inset-0 z-50 flex flex-col bg-brand-bg
            md:static md:inset-auto md:z-auto md:flex-1 md:overflow-hidden"
     :style="{ paddingTop: 'env(safe-area-inset-top)' }">
  ...
</div>
```

### サイドバーを避けるオーバーレイ (PC でサイドバーを隠さない)

```html
<!-- fixed inset-0 だとサイドバーを覆うので、PC では left をずらす -->
<div class="fixed inset-0 md:left-56 lg:left-60 z-[80] ...">
  ...
</div>
```

---

## アニメーション

```css
/* モーダルフェード */
.overlay-enter-active, .overlay-leave-active { transition: opacity .2s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }

/* パネルスライドイン */
.panel-in-enter-active, .panel-in-leave-active { transition: all .25s ease; }
.panel-in-enter-from, .panel-in-leave-to { opacity: 0; transform: translateX(24px); }

/* トースト */
.toast-enter-active, .toast-leave-active { transition: all .25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
```

インタラクション:
- タップ縮小: `active:scale-95` (ボタン) / `active:scale-90` (FAB)
- ホバー: `hover:bg-brand-surface2` (リスト行) / `hover:opacity-90` (プライマリボタン)
- 全トランジション: `transition-colors` or `transition-all`

---

## 数値バッジ (通知・カウント)

```html
<span class="absolute -top-1.5 -right-2 min-w-[16px] h-4
             bg-red-500 text-white text-[9px] font-bold
             rounded-full flex items-center justify-center px-0.5 leading-none">
  {{ count > 99 ? '99+' : count }}
</span>
```

---

## モバイル対応チェックリスト

- セーフエリア: `padding-bottom: env(safe-area-inset-bottom)` (フッター)
- セーフエリア: `padding-top: env(safe-area-inset-top)` (フルスクリーンパネル)
- スクロールバー非表示: `.scrollbar-hide { scrollbar-width: none; } .scrollbar-hide::-webkit-scrollbar { display: none; }`
- タップハイライト無効: `html { -webkit-tap-highlight-color: transparent; }`
- オーバースクロール防止: `body { overscroll-behavior: none; }`

---

## アクセントカラー変更手順

別プロジェクトに移植してアクセントを変える場合:

```css
:root {
  --brand-accent: #e11d48;  /* ← ここをライトモード用色に変更 */
}
.dark {
  --brand-accent: #fb7185;  /* ← ここをダークモード用色に変更 (明るめ) */
}
```

FAB シャドウも合わせて変更:
```html
style="box-shadow: 0 4px 16px rgba(225,29,72,0.35)"
<!-- rgba の最初の3値をアクセントカラーのRGBに変更 -->
```
