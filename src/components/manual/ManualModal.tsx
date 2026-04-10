interface Props { onClose: () => void }

const SECTIONS = [
  {
    icon: '📱', title: '基本的な使い方',
    items: [
      ['週 / 月 切り替え', 'ヘッダーの「週」「月」ボタンで切り替え。週表示は月〜日の7列、月表示は1〜31日の全月表示です。'],
      ['シフトを入力する', 'セルをクリックするとシフト選択モーダルが画面中央に開きます。個人テンプレート・共通テンプレート・休日（公休/有休/当欠）から選択できます。検索ボックスでテンプレートを絞り込めます。'],
      ['この日だけ直接入力', 'モーダル下部の「✏️ この日だけ直接時刻入力」から、テンプレートを使わずにIN/OUT時刻を直接入力できます（30分刻み）。'],
      ['入力をクリアする', 'モーダル下部の「✕ クリア」でセルの入力を消去してパターン自動入力に戻ります。'],
      ['🟡 黄色い点', '週間パターンから自動入力されたセルを示します。手動で変更するとドットが消えます。'],
      ['固定表示', 'No・氏名・入出列は左固定、日付行は上固定、合計列は右固定です。スクロールしても常に見えます。'],
    ],
  },
  {
    icon: '⏱', title: '時間テンプレートの管理',
    items: [
      ['個人テンプレート', '設定 → スタッフ → ⏱ 個人時間テンプレート で、そのスタッフだけが使える時間帯を登録します。名称・略称（3文字以内）・IN/OUT時刻・カラーを設定します。'],
      ['共通テンプレート', '設定 → 🌐 共通テンプレート で、全スタッフが使える時間テンプレートを管理します。'],
      ['優先表示順', 'シフト選択モーダルでは「個人テンプレート → 共通テンプレート → 休日」の順で表示されます。'],
      ['略称', 'シフトセルの下部に表示される識別子です。3文字以内で設定してください（例：日・夜・12）。'],
    ],
  },
  {
    icon: '📅', title: '週間パターン',
    items: [
      ['パターンの作成', '設定 → スタッフ → 📅 週間パターン → 「＋ 週間パターンを作成」で作成します。'],
      ['ブロックの割り当て', 'パターン編集画面でブロックチップをクリックすると曜日選択ポップアップが表示されます。割り当てたい曜日をクリックして設定してください。'],
      ['適用開始日', 'パターンに「適用開始日」を設定すると、その日付以降だけそのパターンが適用されます。月途中からシフトが変わる場合に使います。例：4/16〜 に新パターンを適用すると、4/15以前は旧パターン・4/16以降は新パターンが自動切替されます。'],
      ['パターンの切り替え', 'シフト表のスタッフ名欄のドロップダウンで、デフォルトパターンを切り替えられます。'],
      ['複数パターン', '1人のスタッフに複数のパターンを登録できます（例：通常・夜勤週）。'],
    ],
  },
  {
    icon: '🗓', title: '期間限定パターン（GW・年末年始など）',
    items: [
      ['作成方法', '設定 → スタッフ → 🗓 期間限定パターン → 「＋ 期間限定パターンを作成」で作成します。'],
      ['期間設定', '名称・開始日・終了日を設定すると、その期間の日付が一覧表示されます。各日にシフトを割り当ててください。'],
      ['一括設定', '「一括設定」ボタンで期間内の全日を同じシフトにまとめて設定できます。'],
      ['優先順位', '手動入力 → 期間限定パターン → 週間パターン（適用開始日が最新のもの）→ デフォルトパターン の順で優先されます。'],
      ['注意', '期間内の未設定の日は週間パターンも適用されず空白になります。'],
    ],
  },
  {
    icon: '👤', title: 'スタッフ管理',
    items: [
      ['スタッフの追加', 'シフト表の「＋ スタッフ」ボタン、または設定タブから追加します。名前と部署を入力してください。'],
      ['名前・部署の変更', '設定 → スタッフ → スタッフを開く → 名前・部署を編集できます。'],
      ['退職日の設定', '退職日を入力すると退職日以降のセルがグレーアウトし、翌月から自動的に非表示になります。退職月は通常通り表示されます。'],
      ['退職者の表示', 'シフト表の「退職者も表示」チェックをONにすると退職済みスタッフも確認できます。'],
      ['並び替え', '設定 → スタッフ → 各カードをドラッグ＆ドロップで並び替えできます。↑↓ボタンでも移動可能。同じ部署内のみ移動でき、No は自動的に振り直されます。シフト表・印刷にも即反映。'],
      ['削除と番号繰り上げ', 'スタッフを削除すると同じ部署の番号が自動的に繰り上がります。'],
      ['部署の表示順', 'シフト表・印刷ともに メイク → キッチン → フロント の順で表示されます。'],
    ],
  },
  {
    icon: '📊', title: '月次集計',
    items: [
      ['集計の確認', 'ヘッダーの「集計」タブで月ごとの出勤日数・総時間を確認できます。'],
      ['休憩控除', '実労4.5h〜6.5h未満は0.5h控除、6.5h以上は1h控除して表示されます。'],
      ['表示月の切り替え', 'ヘッダーの ‹ › ボタンで月を切り替えると集計も連動します。'],
    ],
  },
  {
    icon: '🖨', title: '印刷・PDF出力',
    items: [
      ['印刷の開始', 'シフト表の「🖨 印刷 / PDF」ボタンをクリックすると印刷モーダルが開きます。'],
      ['フォーマット①：週表示A4縦（部門別）', '選択した部門ごとに1枚ずつ印刷されます。部門選択ボタンでメイク・キッチン・フロントを個別ON/OFFできます。'],
      ['フォーマット②：月表示A4縦（部門別）', '選択した部門ごと×印刷範囲で出力されます。部門選択と前半/後半の組み合わせで枚数が決まります。'],
      ['フォーマット③：月表示A4縦（メイク・厨房）', 'メイクとキッチンを1枚にまとめて前半・後半の2枚で出力します。'],
      ['フォーマット④：月表示A4横（フロント）', 'フロントのみ、A4横1枚に前半（上）と後半（下）を両方印刷します。'],
      ['部門選択', '①②のフォーマットでは印刷する部門をボタンで選択できます。'],
      ['印刷範囲', '①④以外のフォーマットでは「前半のみ（1〜15日）」「後半のみ（16日〜末日）」「両方」を選択できます。'],
      ['白黒印刷対応', '日曜=濃グレー、土曜=中グレーで識別。有休は○有、当欠は○欠で印刷。公休は印刷されません。'],
      ['新しいウィンドウ', '印刷ボタンで新しいウィンドウが自動で開いて印刷ダイアログが表示されます。ブラウザのポップアップを「許可」にしてください。'],
      ['PDF保存', '印刷ダイアログで「PDFとして保存」を選択。余白「なし」・「背景グラフィックを印刷する」をONにしてください。'],
    ],
  },
  {
    icon: '💾', title: 'データ保存',
    items: [
      ['自動保存', '変更するたびに約1秒後にSupabaseへ自動保存されます。ヘッダー右端のインジケーターで確認できます。'],
      ['🟢 保存済み', '最新の状態が保存されています。'],
      ['🟡 保存中…', '保存処理中です。ブラウザを閉じないでください。'],
      ['🔴 オフライン', 'インターネット未接続またはサーバーエラーです。接続を確認してください。'],
      ['複数端末', '同じURLを別の端末で開いても同じデータが表示されます（ページを再読み込みすると最新データが反映されます）。'],
    ],
  },
]

export function ManualModal({ onClose }: Props) {
  function doPrint() {
    const body = document.getElementById('__manual_content__')
    const win = window.open('', '_blank', 'width=800,height=1000')
    if (!win) { alert('ポップアップをブロックしています。'); return }
    win.document.write(`<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8">
<title>操作マニュアル — HOTEL ELDIA 神戸店</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap">
<style>
@page{size:A4 portrait;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Noto Sans JP',sans-serif;padding:10mm;background:#fff;font-size:9pt}
h1{font-size:14pt;font-weight:700;color:#0f2044;margin-bottom:2mm}
.sub{font-size:8pt;color:#64748b;margin-bottom:5mm}
.section{margin-bottom:6mm;break-inside:avoid}
.sec-title{font-size:10pt;font-weight:700;color:#0f2044;border-bottom:1pt solid #0f2044;padding-bottom:1.5mm;margin-bottom:3mm;display:flex;align-items:center;gap:4pt}
.row{display:flex;gap:8pt;padding:3pt 6pt;background:#f8faff;border-radius:3pt;margin-bottom:2pt;border:0.5pt solid #e2e8f0;break-inside:avoid}
.term{font-weight:700;font-size:8.5pt;color:#0f2044;min-width:90pt;flex-shrink:0}
.desc{font-size:8.5pt;color:#475569;line-height:1.5}
.footer{text-align:center;font-size:7pt;color:#94a3b8;margin-top:5mm;border-top:0.5pt solid #e2e8f0;padding-top:3mm}
</style></head><body>
<h1>❓ 操作マニュアル</h1>
<div class="sub">SHIFTMGR — HOTEL ELDIA 神戸店</div>
${body ? body.innerHTML : ''}
<div class="footer">SHIFTMGR for HOTEL ELDIA 神戸店 — 作成: Claude (Anthropic)</div>
</body></html>`)
    win.document.close()
    setTimeout(() => { win.print(); setTimeout(() => win.close(), 1000) }, 600)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 14, width: 'min(720px,95vw)', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.35)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: '#0f2044', padding: '16px 24px', display: 'flex', alignItems: 'center', borderRadius: '14px 14px 0 0', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>❓ 操作マニュアル</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>SHIFTMGR — HOTEL ELDIA 神戸店</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={doPrint} style={{ background: '#c9a84c', color: '#0f2044', border: 'none', padding: '5px 14px', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 12.5, fontFamily: "'Noto Sans JP',sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}>
              🖨 印刷
            </button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>

        {/* Content */}
        <div id="__manual_content__" style={{ padding: '20px 24px', overflowY: 'auto' }}>
          {SECTIONS.map((sec, si) => (
            <div key={si} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #e2e8f0' }}>
                <span style={{ fontSize: 18 }}>{sec.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 14.5, color: '#0f2044' }}>{sec.title}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sec.items.map(([term, desc], ii) => (
                  <div key={ii} style={{ display: 'flex', gap: 12, padding: '8px 10px', background: '#f8faff', borderRadius: 7, border: '1px solid #e8ecf5' }}>
                    <div style={{ flexShrink: 0, width: 130, fontWeight: 700, fontSize: 12.5, color: '#0f2044' }}>{term}</div>
                    <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.65 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
            SHIFTMGR for HOTEL ELDIA 神戸店　— 作成: Claude (Anthropic)
          </div>
        </div>
      </div>
    </div>
  )
}
