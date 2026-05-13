@echo off
echo ==============================================
echo 1. Fixing and Installing Backend...
echo ==============================================
cd /d "d:\event management system\backend"
call npm install

echo ==============================================
echo 2. Connecting and Seeding MongoDB...
echo ==============================================
call node seed.js

echo ==============================================
echo 3. Installing Frontend...
echo ==============================================
cd /d "d:\event management system\frontend"
call npm install

echo ==============================================
echo 4. Starting Backend Server...
echo ==============================================
start cmd /k "title Backend Server && cd /d ""d:\event management system\backend"" && npm run dev"

echo ==============================================
echo 5. Starting Frontend Application...
echo ==============================================
start cmd /k "title Frontend Server && cd /d ""d:\event management system\frontend"" && npm run dev"

echo ==============================================
echo ALL DONE! 
echo Two new black windows should have opened. 
echo Please keep them open, and go to http://localhost:3000 to login!
echo ==============================================
pause
