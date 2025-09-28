@echo off
echo ===============================================
echo    ATTEND-II AI FACE RECOGNITION SYSTEM
echo ===============================================
echo.

echo [1/2] Starting Backend Server...
start cmd /k "cd /d D:\attend-ii && .\start_backend.bat"

echo Waiting for backend to initialize...
timeout /t 10 /nobreak >nul

echo [2/2] Starting Frontend Server...
start cmd /k "cd /d D:\attend-ii && .\start_frontend.bat"

echo.
echo ===============================================
echo    SYSTEM STARTED SUCCESSFULLY!
echo ===============================================
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause