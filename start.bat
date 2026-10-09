@echo off
rem ELDIA shift server - start (window stays open; close it to stop)
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (
  echo Python is not installed. See WINDOWS.md
  pause
  exit /b 1
)
start "" "http://127.0.0.1:8765/"
py -3 server.py
pause
