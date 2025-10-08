@echo off
echo Starting Attend-II Frontend...
echo.

cd /d "D:\attend-ii\frontend"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install
    echo.
)

echo Starting Next.js development server on http://localhost:3001
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause