# シフト管理（Windows PC 専用）セットアップ

シフト表は Windows PC の中だけで動きます。データは PC 内の `data\eldia.db`（SQLite）に保存され、毎日1回 `data\backups\` に自動バックアップされます（最新60個を保持）。

## 1. Python を入れる（初回のみ）

1. https://www.python.org/downloads/windows/ から最新の Python 3（64-bit インストーラー）をダウンロード
2. インストーラーを実行し、そのまま「Install Now」
   - 「py launcher」にチェックが入っていることを確認（初期状態で入っています）
3. 追加のライブラリは不要です

## 2. アプリを置く

1. https://github.com/JunzoM/eldia-shift を開き「Code」→「Download ZIP」
2. ZIP を展開し、フォルダを `C:\ELDIA\eldia-shift` に置く
   - OneDrive で同期されるフォルダ（デスクトップ・ドキュメントなど）には置かないでください（同期中にDBが壊れることがあります）

## 3. 自動起動を登録（初回のみ）

- `install_autostart.bat` をダブルクリック
  - サーバーが裏で起動し、ブラウザでシフト表が開きます
  - 次回からは Windows にログインすると自動で起動します

## 毎日の使い方

- `open_shift.bat` をダブルクリック、またはブラウザで **http://127.0.0.1:8765/** を開く
  - ブラウザのお気に入りに登録しておくと便利です
- 画面右上の表示が「保存済み」なら保存できています
- 「サーバー未起動（保存されません）」と出たら、`start.bat` をダブルクリックしてから開き直してください

## バックアップ

- 自動：`data\backups\eldia-日付.db` が毎日できます
- 手動：ブラウザで http://127.0.0.1:8765/api/export/shift を開くと、全データを JSON でダウンロードできます
- PC の故障に備え、ときどき `data` フォルダごと USB メモリなどにコピーしておくと安心です

## バックアップから戻す

1. `uninstall_autostart.bat` でサーバーを止める
2. `data\eldia.db`・`eldia.db-wal`・`eldia.db-shm` を別の場所へ退避
3. 戻したいバックアップ（`data\backups\eldia-日付.db`）を `data\eldia.db` という名前でコピー
4. `install_autostart.bat` で再び起動

## アップデート

1. `uninstall_autostart.bat` でサーバーを止める
2. 新しい ZIP の中身で `index.html`・`server.py`・`vendor` フォルダ・`.bat` を上書き（`data` フォルダは消さない）
3. `install_autostart.bat` で再び起動

## 仕組み（メモ）

- `server.py`：Python 標準ライブラリだけで動く小さなサーバー。この PC からだけ接続できます（127.0.0.1）
- `index.html`：シフト表の画面。React などは `vendor` に同梱しているので、インターネットが切れていても動きます（フォントだけはネット経由）
- データ：`kv_store` 表に `staff`・`globalTemplates`・`cellData` の3つを保存
- 予約印刷も、後で同じサーバーに載せる想定です
