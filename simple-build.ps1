$env:PATH = "C:\Program Files\nodejs;C:\Program Files\nodejs\bin;$env:PATH"
Set-Location "c:\projects\reviveai\reviveai"

Write-Host "=== ReviveAI Project Build ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Installing dependencies with npm..." -ForegroundColor Yellow
npm install 2>&1 | Tee-Object -Variable installLog
Write-Host ""

Write-Host "Step 2: Building TypeScript..." -ForegroundColor Yellow
npm run build 2>&1 | Tee-Object -Variable buildLog
Write-Host ""

Write-Host "Step 3: Seeding database..." -ForegroundColor Yellow
npm run db:seed 2>&1 | Tee-Object -Variable seedLog
Write-Host ""

Write-Host "=== Build Complete ===" -ForegroundColor Green
