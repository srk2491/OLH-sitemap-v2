@echo off
cd /d "%~dp0"
echo Open http://localhost:8000 in Chrome
py -m http.server 8000
pause
