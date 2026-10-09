@echo off
rem Register the server to start hidden when this user logs in
cd /d "%~dp0"
where pyw >nul 2>nul
if errorlevel 1 (
  echo Python is not installed. See WINDOWS.md
  pause
  exit /b 1
)
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
> "%STARTUP%\eldia-shift-server.vbs" echo CreateObject("WScript.Shell").Run """pyw"" -3 ""%~dp0server.py""", 0, False
start "" wscript "%STARTUP%\eldia-shift-server.vbs"
timeout /t 3 >nul
start "" "http://127.0.0.1:8765/"
echo Done. The server now starts automatically at logon.
pause
