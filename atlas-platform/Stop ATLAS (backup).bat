@echo off
powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0stop-atlas.ps1"
echo ATLAS stopped.
pause
