@echo off
echo Starting Attend-II Backend Server...
echo.

cd /d "D:\attend-ii\backend"

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Install requirements
echo Installing Python dependencies...
pip install -r requirements.txt

REM Create required directories
if not exist "uploads" mkdir uploads
if not exist "dataset" mkdir dataset
if not exist "model" mkdir model

echo.
echo Starting FastAPI server on http://localhost:8001
echo Press Ctrl+C to stop the server
echo.

python main.py

pause