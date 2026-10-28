@echo off
REM Remove o launcher da TV (reversao da instalacao).
C:\tizen-studio\tools\sdb.exe connect 192.168.18.77:26101
call C:\tizen-studio\tools\ide\bin\tizen.bat uninstall -s 192.168.18.77:26101 -p LMlauncher.Home
pause
