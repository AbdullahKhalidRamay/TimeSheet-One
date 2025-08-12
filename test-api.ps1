# TimeFlow API Testing Script
# This script tests the main API endpoints to verify they're working correctly

param(
    [string]$BaseUrl = "http://localhost:5000",
    [string]$Username = "admin@example.com",
    [string]$Password = "Admin123!"
)

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$White = "White"

# Global variables
$Global:AuthToken = $null
$Global:TestResults = @()

# Helper function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = $White
    )
    Write-Host $Message -ForegroundColor $Color
}

# Helper function to make API requests
function Invoke-APIRequest {
    param(
        [string]$Method = "GET",
        [string]$Endpoint,
        [object]$Body = $null,
        [bool]$RequireAuth = $true
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($RequireAuth -and $Global:AuthToken) {
        $headers["Authorization"] = "Bearer $Global:AuthToken"
    }
    
    $uri = "$BaseUrl$Endpoint"
    
    try {
        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $jsonBody -TimeoutSec 10
        } else {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -TimeoutSec 10
        }
        
        return @{
            Success = $true
            Response = $response
            StatusCode = 200
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        
        return @{
            Success = $false
            StatusCode = $statusCode
            Error = $errorMessage
        }
    }
}

# Test function
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Endpoint,
        [object]$Body = $null,
        [bool]$RequireAuth = $true
    )
    
    Write-ColorOutput "Testing: $Name" $Yellow
    
    $result = Invoke-APIRequest -Method $Method -Endpoint $Endpoint -Body $Body -RequireAuth $RequireAuth
    
    if ($result.Success) {
        Write-ColorOutput "✓ $Name - SUCCESS (Status: $($result.StatusCode))" $Green
        $Global:TestResults += @{
            Name = $Name
            Status = "PASS"
            StatusCode = $result.StatusCode
        }
    } else {
        Write-ColorOutput "✗ $Name - FAILED (Status: $($result.StatusCode)) - $($result.Error)" $Red
        $Global:TestResults += @{
            Name = $Name
            Status = "FAIL"
            StatusCode = $result.StatusCode
            Error = $result.Error
        }
    }
    
    Write-Host ""
}

# Main testing function
function Start-APITesting {
    Write-ColorOutput "=== TimeFlow API Testing ===" $White
    Write-ColorOutput "Base URL: $BaseUrl" $White
    Write-ColorOutput "Username: $Username" $White
    Write-Host ""
    
    # Test 1: Authentication
    Write-ColorOutput "=== Authentication Tests ===" $White
    Test-Endpoint -Name "Login" -Method "POST" -Endpoint "/api/auth/login" -Body @{
        username = $Username
        password = $Password
    } -RequireAuth $false
    
    if ($Global:TestResults[-1].Status -eq "PASS") {
        $Global:AuthToken = $Global:TestResults[-1].Response.token
        Write-ColorOutput "Authentication token obtained successfully" $Green
    } else {
        Write-ColorOutput "Authentication failed. Cannot proceed with authenticated tests." $Red
        return
    }
    
    Write-Host ""
    
    # Test 2: Projects API
    Write-ColorOutput "=== Projects API Tests ===" $White
    Test-Endpoint -Name "Get All Projects" -Endpoint "/api/projects"
    Test-Endpoint -Name "Get Project by ID (if exists)" -Endpoint "/api/projects/1"
    
    # Test 3: Products API
    Write-ColorOutput "=== Products API Tests ===" $White
    Test-Endpoint -Name "Get All Products" -Endpoint "/api/products"
    Test-Endpoint -Name "Get Product by ID (if exists)" -Endpoint "/api/products/1"
    
    # Test 4: Departments API
    Write-ColorOutput "=== Departments API Tests ===" $White
    Test-Endpoint -Name "Get All Departments" -Endpoint "/api/departments"
    Test-Endpoint -Name "Get Department by ID (if exists)" -Endpoint "/api/departments/1"
    
    # Test 5: Teams API
    Write-ColorOutput "=== Teams API Tests ===" $White
    Test-Endpoint -Name "Get All Teams" -Endpoint "/api/teams"
    Test-Endpoint -Name "Get Team by ID (if exists)" -Endpoint "/api/teams/1"
    
    # Test 6: Time Entries API
    Write-ColorOutput "=== Time Entries API Tests ===" $White
    Test-Endpoint -Name "Get All Time Entries" -Endpoint "/api/timeentries"
    Test-Endpoint -Name "Get Time Entry by ID (if exists)" -Endpoint "/api/timeentries/1"
    
    # Test 7: Users API
    Write-ColorOutput "=== Users API Tests ===" $White
    Test-Endpoint -Name "Get All Users" -Endpoint "/api/users"
    Test-Endpoint -Name "Get Current User" -Endpoint "/api/users/me"
    
    # Test 8: Swagger Documentation
    Write-ColorOutput "=== Documentation Tests ===" $White
    Test-Endpoint -Name "Swagger UI" -Endpoint "/swagger" -RequireAuth $false
    
    Write-Host ""
    
    # Summary
    Write-ColorOutput "=== Test Summary ===" $White
    $totalTests = $Global:TestResults.Count
    $passedTests = ($Global:TestResults | Where-Object { $_.Status -eq "PASS" }).Count
    $failedTests = ($Global:TestResults | Where-Object { $_.Status -eq "FAIL" }).Count
    
    Write-ColorOutput "Total Tests: $totalTests" $White
    Write-ColorOutput "Passed: $passedTests" $Green
    Write-ColorOutput "Failed: $failedTests" $Red
    
    if ($failedTests -gt 0) {
        Write-Host ""
        Write-ColorOutput "=== Failed Tests ===" $Red
        $Global:TestResults | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
            Write-ColorOutput "✗ $($_.Name) - Status: $($_.StatusCode) - $($_.Error)" $Red
        }
    }
    
    Write-Host ""
    Write-ColorOutput "=== API Testing Complete ===" $White
}

# Check if API is running
function Test-APIConnection {
    Write-ColorOutput "Checking API connection..." $Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/swagger" -Method GET -TimeoutSec 5
        Write-ColorOutput "✓ API is running and accessible" $Green
        return $true
    }
    catch {
        Write-ColorOutput "✗ API is not accessible. Please ensure the API is running on $BaseUrl" $Red
        Write-ColorOutput "Error: $($_.Exception.Message)" $Red
        return $false
    }
}

# Main execution
if (Test-APIConnection) {
    Start-APITesting
} else {
    Write-ColorOutput "Cannot proceed with testing. Please start the API first." $Red
    Write-ColorOutput "Run: dotnet run (in the TimeSheetAPI directory)" $Yellow
}
