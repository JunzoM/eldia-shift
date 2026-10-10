#!/bin/bash
# ELDIA シフト表（Mac用）— ダブルクリックで起動。このウィンドウを閉じると停止します。
cd "$(dirname "$0")"
if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 が見つかりません。ターミナルで  xcode-select --install  を実行してから、もう一度開いてください。"
  read -r -p "Enterキーで閉じます"; exit 1
fi
if curl -s -m 1 http://127.0.0.1:8765/api/health >/dev/null 2>&1; then
  open "http://127.0.0.1:8765/"; exit 0
fi
( sleep 1.5; open "http://127.0.0.1:8765/" ) &
echo "シフト表を起動しました。使い終わったらこのウィンドウを閉じてください。"
python3 server.py
