@echo off
echo ============================================
echo   EventFlow - MERN Event Management System
echo ============================================
echo.

echo [1/4] Installing Backend Dependencies...
cd /d "d:\event management system\backend"
call npm install
echo.

echo [2/4] Installing Frontend Dependencies...
cd /d "d:\event management system\frontend"
call npm install
echo.

echo [3/4] Starting Backend Server (port 5000)...
cd /d "d:\event management system\backend"
start "EventFlow Backend" cmd /k "node server.js"
echo Backend started!
echo.

echo [4/4] Starting Frontend Dev Server (port 3000)...
cd /d "d:\event management system\frontend"
start "EventFlow Frontend" cmd /k "npm run dev"
echo Frontend started!
echo.

echo ============================================
echo   All done! Open http://localhost:3000
echo ============================================
pause
