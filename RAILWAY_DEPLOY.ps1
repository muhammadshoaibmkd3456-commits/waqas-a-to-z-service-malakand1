# Railway.app Deployment Script for WAQAS A to Z Backend
# This script automates the deployment process

Write-Host "🚀 WAQAS A to Z Backend - Railway.app Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Railway CLI
Write-Host "Step 1: Checking Railway CLI..." -ForegroundColor Yellow
$railwayVersion = railway --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Railway CLI found: $railwayVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Railway CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Check if logged in
Write-Host "Step 2: Checking Railway authentication..." -ForegroundColor Yellow
$status = railway status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in to Railway. Opening login page..." -ForegroundColor Yellow
    railway login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Login failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Successfully logged in" -ForegroundColor Green
} else {
    Write-Host "✅ Already logged in to Railway" -ForegroundColor Green
}

Write-Host ""

# Step 3: Initialize Railway project
Write-Host "Step 3: Initializing Railway project..." -ForegroundColor Yellow
Write-Host "Project name: a-to-z-backend" -ForegroundColor Cyan
Write-Host "Environment: production" -ForegroundColor Cyan

# Check if .railway directory exists
if (Test-Path ".railway") {
    Write-Host "✅ Railway project already initialized" -ForegroundColor Green
} else {
    Write-Host "Initializing new Railway project..." -ForegroundColor Yellow
    railway init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to initialize Railway project" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Railway project initialized" -ForegroundColor Green
}

Write-Host ""

# Step 4: Display next steps
Write-Host "Step 4: Next Steps" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Add PostgreSQL Database:" -ForegroundColor Cyan
Write-Host "   railway add" -ForegroundColor White
Write-Host "   Select: PostgreSQL" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Add Redis Cache:" -ForegroundColor Cyan
Write-Host "   railway add" -ForegroundColor White
Write-Host "   Select: Redis" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Set Environment Variables:" -ForegroundColor Cyan
Write-Host "   railway variables" -ForegroundColor White
Write-Host ""
Write-Host "4. Deploy:" -ForegroundColor Cyan
Write-Host "   railway up" -ForegroundColor White
Write-Host ""
Write-Host "5. View Deployment:" -ForegroundColor Cyan
Write-Host "   railway open" -ForegroundColor White
Write-Host ""

Write-Host "✅ Setup complete! Ready to deploy." -ForegroundColor Green
Write-Host ""
