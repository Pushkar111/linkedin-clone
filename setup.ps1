# Quick Setup Script for LinkedIn Clone Integration

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "LinkedIn Clone - Backend Integration" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Get current directory
$currentDir = (Get-Location).Path
Write-Host "[INFO] Current directory: $currentDir" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the correct directory
$frontendDir = Join-Path -Path $currentDir -ChildPath "frontend-reference"
$backendDir = Join-Path -Path $currentDir -ChildPath "backend"

Write-Host "[DEBUG] Frontend dir: $frontendDir" -ForegroundColor Gray
Write-Host "[DEBUG] Backend dir: $backendDir" -ForegroundColor Gray

if (-not (Test-Path -Path $frontendDir)) {
    Write-Host "[ERROR] frontend-reference directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the linkedin-clone root directory" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path -Path $backendDir)) {
    Write-Host "[ERROR] backend directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the linkedin-clone root directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Directory structure validated" -ForegroundColor Green
Write-Host ""

# Install frontend dependencies
Write-Host "[INFO] Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location -Path $frontendDir

if (Test-Path -Path "node_modules") {
    Write-Host "[SKIP] node_modules already exists, skipping..." -ForegroundColor Yellow
} else {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Frontend installation failed!" -ForegroundColor Red
        Set-Location -Path $currentDir
        exit 1
    }
    Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green
}
Write-Host ""

# Install backend dependencies
Write-Host "[INFO] Installing backend dependencies..." -ForegroundColor Cyan
Set-Location -Path $backendDir

if (Test-Path -Path "node_modules") {
    Write-Host "[SKIP] node_modules already exists, skipping..." -ForegroundColor Yellow
} else {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Backend installation failed!" -ForegroundColor Red
        Set-Location -Path $currentDir
        exit 1
    }
    Write-Host "[OK] Backend dependencies installed" -ForegroundColor Green
}
Write-Host ""

# Return to root directory
Set-Location -Path $currentDir

# Check for .env files
Write-Host "[INFO] Checking configuration files..." -ForegroundColor Cyan

$frontendEnv = Join-Path -Path $frontendDir -ChildPath ".env"
$backendEnv = Join-Path -Path $backendDir -ChildPath ".env"

if (Test-Path -Path $frontendEnv) {
    Write-Host "[OK] Frontend .env found" -ForegroundColor Green
} else {
    Write-Host "[WARN] Frontend .env not found" -ForegroundColor Yellow
    Write-Host "Creating default .env file..." -ForegroundColor Cyan
    "REACT_APP_API_URL=http://localhost:5000/api" | Out-File -FilePath $frontendEnv -Encoding UTF8
    Write-Host "[OK] Created frontend .env" -ForegroundColor Green
}

if (Test-Path -Path $backendEnv) {
    Write-Host "[OK] Backend .env found" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Backend .env not found!" -ForegroundColor Red
    Write-Host "Please create backend/.env with required variables" -ForegroundColor Yellow
    Write-Host "Required variables:" -ForegroundColor Yellow
    Write-Host "  - PORT=5000" -ForegroundColor Yellow
    Write-Host "  - MONGODB_URI=mongodb://localhost:27017/linkedin-clone" -ForegroundColor Yellow
    Write-Host "  - JWT_SECRET=your-secret-key" -ForegroundColor Yellow
    Write-Host "  - JWT_REFRESH_SECRET=your-refresh-secret" -ForegroundColor Yellow
    Write-Host "  - CLOUDINARY_CLOUD_NAME=your-cloud-name" -ForegroundColor Yellow
    Write-Host "  - CLOUDINARY_API_KEY=your-api-key" -ForegroundColor Yellow
    Write-Host "  - CLOUDINARY_API_SECRET=your-api-secret" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "[OK] Setup Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start MongoDB:" -ForegroundColor White
Write-Host "   mongod" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start Backend (Terminal 1):" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host "   # Backend runs on http://localhost:5000" -ForegroundColor DarkGray
Write-Host ""
Write-Host "3. Start Frontend (Terminal 2):" -ForegroundColor White
Write-Host "   cd frontend-reference" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host "   # Frontend runs on http://localhost:3000" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "   - INTEGRATION_SUMMARY.md - Quick overview" -ForegroundColor Gray
Write-Host "   - INTEGRATION_GUIDE.md - Detailed guide" -ForegroundColor Gray
Write-Host "   - backend/API_DOCUMENTATION.md - API reference" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy coding!" -ForegroundColor Green