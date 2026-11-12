@echo off
cd /d "%~dp0"
node scripts/build.mjs
if errorlevel 1 exit /b 1
start http://localhost:4173
node scripts/serve.mjs
pause
