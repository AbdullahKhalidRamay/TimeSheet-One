# Run-API.ps1
# PowerShell script to set up and run the TimeSheetAPI

# Navigate to the API project directory
Set-Location -Path "$PSScriptRoot\TimeSheetAPI"

# Check if dotnet CLI is available
$dotnetVersion = dotnet --version
if ($LASTEXITCODE -ne 0) {
    Write-Error "dotnet CLI is not available. Please install .NET SDK."
    exit 1
}

Write-Host "Using .NET SDK version: $dotnetVersion" -ForegroundColor Green

# Restore packages
Write-Host "Restoring NuGet packages..." -ForegroundColor Cyan
dotnet restore
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to restore packages."
    exit 1
}

# Build the project
Write-Host "Building the project..." -ForegroundColor Cyan
dotnet build --configuration Debug --no-restore
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed."
    exit 1
}

# Apply migrations
Write-Host "Applying database migrations..." -ForegroundColor Cyan
dotnet ef database update
if ($LASTEXITCODE -ne 0) {
    Write-Host "Migration command failed. You may need to install the EF Core tools:" -ForegroundColor Yellow
    Write-Host "dotnet tool install --global dotnet-ef" -ForegroundColor Yellow
    
    $installTools = Read-Host "Do you want to install EF Core tools now? (y/n)"
    if ($installTools -eq "y") {
        dotnet tool install --global dotnet-ef
        if ($LASTEXITCODE -eq 0) {
            Write-Host "EF Core tools installed. Retrying migrations..." -ForegroundColor Green
            dotnet ef database update
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Migration failed after installing tools."
                exit 1
            }
        } else {
            Write-Error "Failed to install EF Core tools."
            exit 1
        }
    } else {
        Write-Host "Skipping migrations. The database may not be properly set up." -ForegroundColor Yellow
    }
}

# Run the API
Write-Host "Starting the TimeSheetAPI..." -ForegroundColor Green
dotnet run --no-build