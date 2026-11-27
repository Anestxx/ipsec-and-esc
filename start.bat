@echo off
cd /d "%~dp0"

start "SecureTunnel Backend" cmd /k "cd /d "%~dp0backend" && py -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
timeout /t 2 /nobreak >nul
start "SecureTunnel Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 127.0.0.1"

timeout /t 4 /nobreak >nul
start "" "http://127.0.0.1:5173"
