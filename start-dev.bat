@echo off
echo ==========================================
echo  StorePrint Dev Environment Startup
echo ==========================================

echo.
echo [1/3] Checking Docker containers...
cd /d "%~dp0infra"
docker compose ps --format "table {{.Name}}\t{{.Status}}" 2>nul
if %errorlevel% neq 0 (
    echo Docker is not running. Starting containers...
    docker compose up -d
) else (
    echo Checking if containers are up...
    docker compose up -d
)

echo.
echo [2/3] Starting Admin Portal on http://localhost:3002/admin/
start "StorePrint Admin" cmd /k "cd /d %~dp0apps\admin && npm run dev"

echo.
echo [3/3] Starting Mobile App (Expo) on http://localhost:8081
start "StorePrint Mobile" cmd /k "cd /d %~dp0apps\mobile && npx expo start"

echo.
echo ==========================================
echo  All services started!
echo.
echo  Admin Portal : http://localhost:3002/admin/
echo  Mobile Web   : http://localhost:8081
echo  API          : http://localhost:3000
echo  MinIO Console: http://localhost:9001
echo ==========================================
echo.
pause
