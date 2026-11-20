$env:PATH = "C:\Program Files\nodejs;$env:PATH"
Set-Location "c:\projects\reviveai\reviveai"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    ReviveAI - Full Build and Bootstrap" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build Server TypeScript
Write-Host "[1/4] Building server TypeScript..." -ForegroundColor Yellow
Set-Location "packages/server"
& npx typescript 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Server build completed successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Server build failed" -ForegroundColor Red
    Set-Location "../.."
    exit 1
}
Set-Location "../.."
Write-Host ""

# Step 2: Seed Database
Write-Host "[2/4] Seeding database with demo leads..." -ForegroundColor Yellow
Set-Location "packages/server"
& npx tsx scripts/seed.ts 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database seeded successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Database seed failed" -ForegroundColor Red
    Set-Location "../.."
    exit 1
}
Set-Location "../.."
Write-Host ""

# Step 3: Verify Build
Write-Host "[3/4] Verifying build artifacts..." -ForegroundColor Yellow
if (Test-Path "packages/server/dist/index.js") {
    Write-Host "[OK] Server binary built" -ForegroundColor Green
}
if (Test-Path "packages/server/data/reviveai.db") {
    Write-Host "[OK] Database created and seeded" -ForegroundColor Green
}
Write-Host ""

# Step 4: Summary
Write-Host "[4/4] Build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "        Ready to run ReviveAI!" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Start the backend server:" -ForegroundColor Cyan
Write-Host "  cd packages/server" -ForegroundColor Gray
Write-Host "  npx tsx src/index.ts" -ForegroundColor Yellow
Write-Host ""
Write-Host "API Endpoints:" -ForegroundColor Cyan
Write-Host "  GET  /api/leads              - List all leads" -ForegroundColor Gray
Write-Host "  GET  /api/leads/:id          - Get lead details" -ForegroundColor Gray
Write-Host "  GET  /api/internal/leads/stale - Stale leads" -ForegroundColor Gray
Write-Host "  GET  /api/analytics/summary  - Dashboard metrics" -ForegroundColor Gray
Write-Host ""
Write-Host "Demo data: 10 AC repair leads (RV-1001 to RV-1010)" -ForegroundColor Gray
Write-Host ""
