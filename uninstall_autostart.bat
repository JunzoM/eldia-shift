@echo off
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\eldia-shift-server.vbs" 2>nul
taskkill /f /im pyw.exe >nul 2>nul
taskkill /f /im pythonw.exe >nul 2>nul
echo Autostart removed.
pause
