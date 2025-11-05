# Simple Git Auto-Commit Script
Write-Host "=== Git Auto-Commit ===" -ForegroundColor Cyan
Write-Host ""

# Check git status
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "[OK] No changes to commit" -ForegroundColor Green
    exit 0
}

# Show changes
Write-Host "[INFO] Changes detected:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Detect change type
$hasBackend = $status -match "backend/"
$hasFrontend = $status -match "frontend"
$hasDeployment = $status -match "(yaml|yml|docker|vercel\.json|render\.yaml)"
$hasDocs = $status -match "\.md"

# Generate message
if ($hasDeployment) {
    $type = "ci"
    $msg = "Add Vercel and Render deployment configurations"
}
elseif ($hasBackend -and $hasFrontend) {
    $type = "feat"
    $msg = "Update backend and frontend"
}
elseif ($hasBackend) {
    $type = "feat"
    $msg = "Update backend"
}
elseif ($hasFrontend) {
    $type = "feat"
    $msg = "Update frontend"
}
elseif ($hasDocs) {
    $type = "docs"
    $msg = "Update documentation"
}
else {
    $type = "chore"
    $msg = "Update project files"
}

$commitMsg = $type + ": " + $msg

Write-Host "[COMMIT] $commitMsg" -ForegroundColor Cyan
Write-Host ""
$confirm = Read-Host "Continue? (Y/n)"

if ($confirm -eq "n") {
    Write-Host "[CANCELLED]" -ForegroundColor Red
    exit 0
}

# Commit
Write-Host "[STAGING] Adding all files..." -ForegroundColor Yellow
git add .

Write-Host "[COMMITTING] Creating commit..." -ForegroundColor Yellow
git commit -m $commitMsg

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Committed successfully!" -ForegroundColor Green
    git log -1 --oneline
    
    Write-Host ""
    $push = Read-Host "Push to remote? (Y/n)"
    if ($push -ne "n") {
        Write-Host "[PUSHING] Pushing to remote..." -ForegroundColor Yellow
        $branch = git branch --show-current
        git push origin $branch
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[SUCCESS] Pushed to $branch" -ForegroundColor Green
        }
        else {
            Write-Host "[WARNING] Push failed" -ForegroundColor Yellow
        }
    }
}
else {
    Write-Host "[ERROR] Commit failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "[DONE] Script completed" -ForegroundColor Green
