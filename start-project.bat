@echo off
echo Starting SmartMenu...

REM ---------------------------
REM CHECK NODE
REM ---------------------------
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js not installed!
    echo Install it from https://nodejs.org/
    pause
    exit
)

REM ---------------------------
REM CHECK DOTNET
REM ---------------------------
where dotnet >nul 2>nul
if %errorlevel% neq 0 (
    echo .NET SDK not installed!
    echo Install it from https://dotnet.microsoft.com/
    pause
    exit
)

REM ---------------------------
REM INSTALL FRONTEND PACKAGES
REM ---------------------------
if not exist frontend\smartmenu\node_modules (
    echo Installing frontend dependencies...
    cd frontend\smartmenu
    npm install
    cd ..\..
) else (
    echo node_modules already installed
)

REM ---------------------------
REM START BACKEND
REM ---------------------------
echo Starting backend...
start cmd /k "cd backend && dotnet run --project RestaurantSmartMenu.Api"

timeout /t 3 >nul

REM ---------------------------
REM START FRONTEND
REM ---------------------------
echo Starting frontend...
start cmd /k "cd frontend\smartmenu && npm run dev"

timeout /t 5 >nul

REM ---------------------------
REM OPEN WEBSITE
REM ---------------------------
echo Opening site...
start http://localhost:5173/?table=5

echo SmartMenu started!
pause