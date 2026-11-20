@echo off
cd /d c:\projects\reviveai\reviveai
setlocal enabledelayedexpansion
set PATH=C:\Program Files\nodejs;%PATH%
echo Installing pnpm globally...
npm install -g pnpm 2>&1
echo.
echo Installing project dependencies...
pnpm install 2>&1
echo.
echo Building project...
pnpm run build 2>&1
echo.
echo Build complete!
