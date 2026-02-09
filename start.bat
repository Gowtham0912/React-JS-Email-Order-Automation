@echo off
echo ========================================
echo Starting Email Order Automation System
echo ========================================
echo.

:: Start Flask Backend in a new window
echo Starting Flask Backend on http://localhost:5000
start "Flask Backend" cmd /k "cd /d %~dp0 && python -m erp.app"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak > nul

:: Start React Frontend in a new window
echo Starting React Frontend on http://localhost:5173
start "React Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to close this window...
pause > nul
