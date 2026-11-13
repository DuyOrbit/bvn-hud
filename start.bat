@echo off
title BVN Tournament HUD Server
cd /d "%~dp0"
echo ===================================================
echo     DANG KHOI CHAY SERVER BVN TOURNAMENT HUD
echo ===================================================
echo Server chay tai: http://localhost:3000
echo.
start http://localhost:3000/admin.html
start http://localhost:3000/overlay.html
node server.js
pause

