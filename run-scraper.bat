@echo off
cd /d "%~dp0"
if not exist "ashraya_master_report.json" (echo Missing report backup source & pause & exit /b 1)
copy /Y "ashraya_master_report.json" "ashraya_master_report.backup.json" >nul
echo Backed up current report to ashraya_master_report.backup.json
py Scraping.py
if errorlevel 1 (echo Scraper failed. Existing report should be retained. & pause & exit /b 1)
echo Scrape complete. Check results and reload browser with Ctrl+F5.
pause
