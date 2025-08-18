@echo off
echo ===================================
echo  Classroom Money Organizer Setup
echo ===================================

echo.
echo --- Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo --- Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo ===================================
echo      Starting Servers
echo ===================================
echo.
echo --- Starting backend server in a new window...
start "Backend Server" cmd /k "cd backend && node index.js"

echo.
echo --- Starting frontend server in a new window...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo ===================================
echo   Servers are starting up...
echo ===================================
echo.
echo Please wait for the browser window to open with the application.
echo You will have two new command prompt windows for the backend and frontend servers.
echo You can close this window now.

pause
