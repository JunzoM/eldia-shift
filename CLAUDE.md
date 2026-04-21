# CLAUDE.md — eldia-shift

ホテルエルディア（HOTEL ELDIA）向けシフト管理システム。3部門（フロント・キッチン・メイク）のスタッフのシフトをクラウド同期で管理する。

---

## スタック

- **Vue 3** + TypeScript (Composition API `<script setup>`)
- **Vite** ビルドツール
- **Tailwind CSS v3** (`darkMode: 'class'`)
- **Pinia** 状態管理
- **Supabase** (DB: `shift_store` テーブル)
- フォント: **Noto Sans JP** / **JetBrains Mono**

---

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動 (localhost:5173)
npm run build    # TypeScript 型チェック + Vite ビルド
npm run preview  # ビルド後のプレビュー
```

**Supabase 接続情報は `.env` ファイルで管理（`.gitignore` に追加すること）:**

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## プロジェクト構成

```
src/
├── main.ts                    # エントリポイント（Pinia マウント）
├── App.vue                    # ルートコンポーネント（ビュー切替・初期ロード）
├── types/index.ts             # 全共有型定義
├── constants/
│   ├── palette.ts             # PALETTE (10色) / JP_WD
│   ├── offBlocks.ts           # OFF_BLOCKS (公休/有休/当欠)
│   ├── departments.ts         # INIT_DEPTS
│   └── initialData.ts         # INIT_STAFF / INIT_GLOBAL_TEMPLATES
├── utils/
│   ├── dateHelpers.ts         # getMondayOf / parseLocalDate / toLocalDateStr / uid …
│   ├── shiftLogic.ts          # getEffective / findBlock / calcH / calcNetH / cellKey
│   └── printHelper.ts         # buildPrintHTML / doPrint
├── lib/supabase.ts            # dbLoad / dbSave
├── stores/
│   ├── useShiftStore.ts       # cellData / dbStatus / loadAll / setupWatcher
│   ├── useStaffStore.ts       # staff[] / staffByDept / CRUD / reorder
│   ├── useTemplateStore.ts    # globalTemplates[]
│   └── useUIStore.ts          # viewMode / locked / weekStart / year / month など
├── composables/useTheme.ts    # ダークモード切替
└── components/
    ├── layout/                # AppHeader / DbStatusBadge
    ├── grid/                  # ShiftGrid / ShiftTable / ShiftCell / CellPicker / DirectTimeInput
    ├── settings/              # SettingsView / StaffCard / StaffPatternPanel / PeriodPatternPanel
    ├── templates/             # GlobalTemplateManager / TimeBlockForm / TimeBlockCard / PatternEditor / DayBlockChip
    ├── summary/               # SummaryView
    ├── print/                 # PrintModal
    ├── manual/                # ManualModal
    └── shared/                # BaseModal / PaletteSelector
```

---

## カラーシステム

CSS変数 (`src/assets/base.css`) でライト/ダークを切り替える。

| トークン | ライト | ダーク | 用途 |
|---|---|---|---|
| `--brand-bg` | `#f5f5f5` | `#0f1117` | ページ背景 |
| `--brand-surface` | `#ffffff` | `#1a1d27` | カード・モーダル |
| `--brand-surface2` | `#e8e8ee` | `#232635` | 入力欄・ホバー背景 |
| `--brand-border` | `#c0c0c0` | `#2e3248` | 枠線全般 |
| `--brand-accent` | `#e11d48` | `#fb7185` | プライマリアクション |
| `--brand-text` | `#1a1614` | `#e8e2d4` | 本文・見出し |
| `--brand-muted` | `#6b6456` | `#7a7a8a` | サブテキスト |

Tailwind クラスは `bg-brand-surface`・`text-brand-accent` などを使う（`tailwind.config.ts` で CSS変数にマッピング済み）。

---

## Supabase データ構造

テーブル: `shift_store` (`key TEXT`, `value JSONB`, `updated_at TIMESTAMPTZ`)

| キー | 内容 |
|---|---|
| `"staff"` | スタッフ配列（timeBlocks / patterns / periodPatterns 含む）|
| `"globalTemplates"` | 共通テンプレート配列 |
| `"cellData"` | 手動上書き: `"staffId|YYYY-MM-DD"` → EffectiveCell |

**自動保存:** staff・globalTemplates・cellData のいずれかが変わると 1.2秒後に保存（debounce）。初期ロード中は保存しない（`dbStatus` を確認）。

---

## セル解決優先度（`getEffective` 関数）

`src/utils/shiftLogic.ts` の `getEffective(s, dateObj, cellData, globalTemplates)` が全ての表示・集計・印刷で使われる純粋関数。

1. **手動上書き** (`cellData["staffId|UTC日付"]`)
2. **期間パターン** (`periodPatterns`、開始〜終了日が一致するもの)
3. **週次パターン** (`activeFrom` が最新で `dStr` 以前のもの)
4. **デフォルト** (`activePatternId` のパターン)

**日付の2系統（意図的な差異）:**
- `cellData` キー → `dateObj.toISOString().slice(0, 10)` (UTC)
- 期間パターン比較 → `getFullYear/getMonth/getDate` のローカル日付文字列

この差異は既存データの互換性のために維持すること。

---

## 部門

| ID | ラベル | colorIdx |
|---|---|---|
| `front` | フロント | 0 (blue) |
| `kitchen` | キッチン | 2 (teal) |
| `make` | メイク | 7 (pink) |

---

## 主要な制約

- **`getEffective` は純粋関数** — ストアに依存しない。グリッド・集計・印刷の3箇所で共有。
- **休憩控除** (`calcNetH`): 4.5h以上→-0.5h、6.5h以上→-1h。集計と印刷で使う。
- **印刷** はブラウザの `window.open` + `document.write` で新ウィンドウに HTML を渡す（Vue コンポーネントのDOMクローンは不可）。
- **ロック状態** (`ui.locked` デフォルト `true`): ShiftCell はロック中クリック不可。
- **スタッフ ID** は数値。新規スタッフは `nextId = 400` から順番に割り振る。

---

## コミット規約

```
feat: 日本語で変更内容を説明
fix: 日本語で修正内容を説明
```

ブランチ名: `claude/add-<feature>-<short-hash>`（例: `claude/add-mobile-responsive-design-akUeR`）
