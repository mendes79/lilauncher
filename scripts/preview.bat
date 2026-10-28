@echo off
REM Abre o simulador do launcher no navegador. Nao envia nada para a TV.
start "" http://localhost:8080
node "%~dp0preview.mjs"
pause
