@echo off
echo ========================================================
echo   Launching VikingsERP Unified System (MVC Monorepo)
echo ========================================================
echo.

:: 1. Launch Backend API (Port 4000)
start "VikingsERP Backend (Port 4000)" cmd /k "cd /d C:\laragon\www\VikingsERP-Work\VikingsGrill-ERP\backend && npm run dev"

:: 2. Launch Unified Frontend (Port 5173)
start "VikingsERP Frontend (Port 5173)" cmd /k "cd /d C:\laragon\www\VikingsERP-Work\VikingsGrill-ERP\frontend && npm run dev"

:: 3. (Optional) Launch Analytics Suite if present
if exist "C:\laragon\www\vikings_ra_kpi_module\frontend" (
  echo Launching Companion Analytics Suite (Port 5175)...
  start "Vikings RA-KPI Frontend" cmd /k "cd /d C:\laragon\www\vikings_ra_kpi_module\frontend && npm run dev"
)

echo Both servers are booting!
echo Frontend URL: http://localhost:5173
echo Backend API:  http://localhost:4000
echo ========================================================
pause

