@echo off
cd /d "%~dp0"

echo Installing SecureTunnel dependencies...
py -m pip install -r backend\requirements.txt
if errorlevel 1 exit /b 1

cd frontend
call npm install
if errorlevel 1 exit /b 1

echo.
echo Setup complete. Run start.bat to launch SecureTunnel.
