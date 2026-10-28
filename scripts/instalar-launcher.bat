@echo off
REM Instala e abre o launcher na TV. Reversivel: scripts\remover-launcher.bat
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar-launcher.ps1" %*
pause
