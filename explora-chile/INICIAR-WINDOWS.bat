@echo off
chcp 65001 >nul
title Explora Chile
cd /d "%~dp0"
where py >nul 2>nul && (py server.py & goto fin)
where python >nul 2>nul && (python server.py & goto fin)
echo.
echo No encontre Python. Instalalo desde https://www.python.org/downloads/
echo (marca la casilla "Add python.exe to PATH" al instalar) y vuelve a abrir este archivo.
:fin
pause
