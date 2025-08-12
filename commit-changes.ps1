# PowerShell script to commit and push changes for both frontend and backend

Write-Host "Starting commit and push process..." -ForegroundColor Green

# Function to commit and push changes
function Commit-And-Push {
    param(
        [string]$ProjectPath,
        [string]$ProjectName
    )
    
    Write-Host "Processing $ProjectName at $ProjectPath" -ForegroundColor Yellow
    
    # Change to project directory
    Set-Location $ProjectPath
    
    # Check if git repository exists
    if (-not (Test-Path ".git")) {
        Write-Host "No git repository found in $ProjectPath" -ForegroundColor Red
        return
    }
    
    # Check git status
    $status = git status --porcelain
    if (-not $status) {
        Write-Host "No changes to commit in $ProjectName" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Changes found in $ProjectName" -ForegroundColor Green
    git status --short
    
    # Add all changes
    Write-Host "Adding changes..." -ForegroundColor Cyan
    git add .
    
    # Create commit message
    $commitMessage = "feat: Complete frontend-backend integration for TimeFlow

- Updated frontend to use real API calls instead of local storage
- Implemented Product and Department APIs with proper hierarchy (stages/functions)
- Added team association functionality for products and departments
- Enhanced weekly time tracker with description fields and date selection
- Fixed API service layer with proper error handling
- Updated TimeEntry interface to match backend model
- Completed remaining frontend integration tasks
- Added comprehensive API testing plan and scripts

Backend changes:
- Created Product and Department models with hierarchy
- Implemented ProductService and DepartmentService
- Added team association methods for products and departments
- Updated database context and migrations
- Enhanced controllers with full CRUD operations

Frontend changes:
- Replaced local storage with API service calls
- Updated WeeklyTimeTracker with real data loading
- Enhanced Teams page with product/department associations
- Fixed all linter errors and type issues
- Improved error handling and user feedback"
    
    # Commit changes
    Write-Host "Committing changes..." -ForegroundColor Cyan
    git commit -m $commitMessage
    
    # Push changes
    Write-Host "Pushing changes..." -ForegroundColor Cyan
    git push
    
    Write-Host "$ProjectName changes committed and pushed successfully!" -ForegroundColor Green
}

# Get current directory
$currentDir = Get-Location

try {
    # Commit and push frontend changes
    $frontendPath = "D:\pro-timeflow-main"
    Commit-And-Push -ProjectPath $frontendPath -ProjectName "Frontend"
    
    # Commit and push backend changes
    $backendPath = "D:\project\TimeSheetOne\TimeSheetAPI"
    Commit-And-Push -ProjectPath $backendPath -ProjectName "Backend"
    
    Write-Host "All changes committed and pushed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "Error during commit and push process: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Return to original directory
    Set-Location $currentDir
}

Write-Host "Commit and push process completed!" -ForegroundColor Green
