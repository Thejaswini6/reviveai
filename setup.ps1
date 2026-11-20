$env:PATH = "C:\Program Files\nodejs;$env:PATH"
Set-Location "c:\projects\reviveai\reviveai"

Write-Host "Step 1: Installing pnpm globally..." -ForegroundColor Cyan
& npm install -g pnpm
Write-Host "Step 1 Complete" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Installing project dependencies..." -ForegroundColor Cyan
& pnpm install
Write-Host "Step 2 Complete" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Building project..." -ForegroundColor Cyan
& pnpm run build
Write-Host "Step 3 Complete" -ForegroundColor Green
Write-Host ""

Write-Host "Setup complete! Now seeding database..." -ForegroundColor Cyan
& pnpm run db:seed
Write-Host "Database seeded!" -ForegroundColor Green
