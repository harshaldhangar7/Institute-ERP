@echo off
REM Setup script for Institute ERP Backend (Windows)
REM Creates a Python virtual environment and installs dependencies
REM Supports Python 3.11, 3.12, and 3.13

echo Setting up Institute ERP Backend...

REM Create virtual environment
echo Creating Python virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies from requirements.txt...
pip install -r requirements.txt

echo.
echo Setup complete!
echo.
echo To activate the virtual environment next time, run:
echo   venv\Scripts\activate.bat
echo.
echo To start the development server:
echo   uvicorn app.main:app --reload --port 5000
