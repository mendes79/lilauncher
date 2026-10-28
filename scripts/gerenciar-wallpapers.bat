@echo off
REM Gerenciador de wallpapers do lilauncher (listar, adicionar, substituir, remover, aplicar).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0gerenciar-wallpapers.ps1" %*
pause
