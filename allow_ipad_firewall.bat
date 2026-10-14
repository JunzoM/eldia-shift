@echo off
rem Allow iPads on the office Wi-Fi (private network) to reach the shift server (port 8765).
rem Right-click this file and choose "Run as administrator".
net session >nul 2>&1
if errorlevel 1 (
  echo Please right-click this file and choose "Run as administrator".
  pause
  exit /b 1
)
netsh advfirewall firewall delete rule name="ELDIA Shift (iPad)" >nul 2>&1
netsh advfirewall firewall add rule name="ELDIA Shift (iPad)" dir=in action=allow protocol=TCP localport=8765 profile=private
echo Done. iPads on the same private Wi-Fi can now connect to port 8765.
pause
