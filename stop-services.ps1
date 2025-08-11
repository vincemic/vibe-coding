# Stop Services Script
# This script stops both frontend (Node.js/Angular) and backend (.NET) development servers

Write-Host "🛑 Stopping development services..." -ForegroundColor Yellow

# Stop Node.js processes (Angular dev server)
Write-Host "Stopping frontend (Node.js) processes..." -ForegroundColor Cyan
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | ForEach-Object {
            Write-Host "  Stopping Node.js process (PID: $($_.Id))" -ForegroundColor Gray
            Stop-Process -Id $_.Id -Force
        }
        Write-Host "✅ Frontend processes stopped" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ No Node.js processes found" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️ Error stopping Node.js processes: $($_.Exception.Message)" -ForegroundColor Red
}

# Stop .NET processes (Backend API server)
Write-Host "Stopping backend (.NET) processes..." -ForegroundColor Cyan
try {
    $dotnetProcesses = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue
    if ($dotnetProcesses) {
        $dotnetProcesses | ForEach-Object {
            Write-Host "  Stopping .NET process (PID: $($_.Id))" -ForegroundColor Gray
            Stop-Process -Id $_.Id -Force
        }
        Write-Host "✅ Backend processes stopped" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ No .NET processes found" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️ Error stopping .NET processes: $($_.Exception.Message)" -ForegroundColor Red
}

# Stop any compiled backend executables
Write-Host "Checking for compiled backend executables..." -ForegroundColor Cyan
try {
    $backendProcesses = Get-Process -Name "ChatbotApp.Backend" -ErrorAction SilentlyContinue
    if ($backendProcesses) {
        $backendProcesses | ForEach-Object {
            Write-Host "  Stopping ChatbotApp.Backend process (PID: $($_.Id))" -ForegroundColor Gray
            Stop-Process -Id $_.Id -Force
        }
        Write-Host "✅ Backend executable processes stopped" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ No compiled backend processes found" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️ Error stopping backend executables: $($_.Exception.Message)" -ForegroundColor Red
}

# Optional: Kill any VS Code tasks that might be running
Write-Host "Checking for any remaining development tasks..." -ForegroundColor Cyan
$vsCodeTasks = @("npm", "ng", "dotnet")
foreach ($taskName in $vsCodeTasks) {
    try {
        $processes = Get-Process -Name $taskName -ErrorAction SilentlyContinue
        if ($processes) {
            $processes | ForEach-Object {
                Write-Host "  Stopping $taskName process (PID: $($_.Id))" -ForegroundColor Gray
                Stop-Process -Id $_.Id -Force
            }
        }
    } catch {
        # Silently continue if process not found
    }
}

Write-Host ""
Write-Host "🎉 All development services have been stopped!" -ForegroundColor Green
Write-Host "💡 To restart services, use:" -ForegroundColor Yellow
Write-Host "   Frontend: cd Frontend && npm start" -ForegroundColor Gray
Write-Host "   Backend:  dotnet run --project Backend/ChatbotApp.Backend.csproj" -ForegroundColor Gray
Write-Host "   Or use F5 in VS Code to start debugging" -ForegroundColor Gray
