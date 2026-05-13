@echo off
echo ============================================
echo   EventFlow - Database Seeding Utility
echo ============================================
echo.
echo This script will:
echo 1. Install backend dependencies (if needed)
echo 2. CLEAR your current database
echo 3. ADD sample Users and Events
echo.
set /p confirm="Are you sure you want to proceed? (Y/N): "
if /i "%confirm%" neq "Y" goto end

echo.
echo [1/2] Checking Dependencies...
cd /d "d:\event management system\backend"
if not exist node_modules (
    call npm install
)

echo.
echo [2/2] Seeding Database...
node seed.js

echo.
echo ============================================
echo   ✅ Database Seeded Successfully!
echo   You can now run START.bat to begin.
echo ============================================
:end
pause
