# Production Deployment Script for TransferNest (PowerShell)

Write-Host "🚀 Starting TransferNest Production Deployment..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies." -ForegroundColor Red
    exit 1
}

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build

# Check build status
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

# Build Firebase Functions
Write-Host "🔧 Building Firebase Functions..." -ForegroundColor Yellow
Set-Location functions
npm ci
npm run build
Set-Location ..

# Deploy to Firebase (if Firebase CLI is available)
$firebaseCmd = Get-Command firebase -ErrorAction SilentlyContinue
if ($firebaseCmd) {
    Write-Host "🚀 Deploying to Firebase..." -ForegroundColor Yellow
    firebase deploy
} else {
    Write-Host "⚠️  Firebase CLI not found. Skipping deployment." -ForegroundColor Yellow
    Write-Host "   To deploy manually, run: firebase deploy" -ForegroundColor White
}

Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
