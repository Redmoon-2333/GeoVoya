param(
    [int]$ApiPort = 8000,
    [int]$WebPort = 5173
)

$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtimeDirectory = Join-Path $projectRoot '.runtime'
$statePath = Join-Path $runtimeDirectory 'servers.json'
$backendDirectory = Join-Path $projectRoot 'backend'
$frontendDirectory = Join-Path $projectRoot 'frontend'
$pythonPath = Join-Path $backendDirectory '.venv\Scripts\python.exe'
$vitePath = Join-Path $frontendDirectory 'node_modules\vite\bin\vite.js'

function Test-ManagedProcess($record) {
    $process = Get-Process -Id $record.Id -ErrorAction SilentlyContinue
    return $process -and $process.StartTime.ToUniversalTime().Ticks -eq ([datetime]$record.StartTime).ToUniversalTime().Ticks
}

function Find-FreePort([int]$preferred) {
    for ($candidate = $preferred; $candidate -lt ($preferred + 100); $candidate++) {
        $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $candidate)
        try {
            $listener.Start()
            return $candidate
        } catch [Net.Sockets.SocketException] {
            continue
        } finally {
            $listener.Stop()
        }
    }
    throw "No free port near $preferred."
}

function Wait-Ready([string]$url) {
    $deadline = [DateTime]::UtcNow.AddSeconds(25)
    while ([DateTime]::UtcNow -lt $deadline) {
        try {
            if ((Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200) { return }
        } catch { }
        Start-Sleep -Milliseconds 250
    }
    throw "Server did not respond: $url. Check logs in $runtimeDirectory."
}

if (Test-Path -LiteralPath $statePath) {
    $savedState = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    $running = @($savedState.Processes | Where-Object { Test-ManagedProcess $_ })
    if ($running.Count -gt 0) {
        Write-Output "A managed server is already running. Open $($savedState.WebUrl)"
        Write-Output "Use tools\stop.ps1 before starting again."
        exit 0
    }
}
if (!(Test-Path -LiteralPath $pythonPath) -or !(Test-Path -LiteralPath $vitePath)) {
    throw 'Install dependencies first: backend: uv sync --python 3.12; frontend: pnpm install.'
}
if (!(Test-Path -LiteralPath (Join-Path $frontendDirectory 'public\media\forest-floor.webp'))) {
    throw 'Prepare photographs first: cd frontend; pnpm prepare:assets.'
}
$nodePath = (Get-Command node -ErrorAction Stop).Source
New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null
$chosenApiPort = Find-FreePort $ApiPort
$chosenWebPort = Find-FreePort $WebPort
if ($chosenWebPort -eq $chosenApiPort) { $chosenWebPort = Find-FreePort ($chosenWebPort + 1) }
$webUrl = "http://127.0.0.1:$chosenWebPort"
$apiUrl = "http://127.0.0.1:$chosenApiPort"
$started = @()
$previousApiUrl = $env:GEOVR_API_URL
try {
    $backendProcess = Start-Process -FilePath $pythonPath -ArgumentList @('-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', "$chosenApiPort") -WorkingDirectory $backendDirectory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDirectory 'backend.log') -RedirectStandardError (Join-Path $runtimeDirectory 'backend.error.log')
    $started += $backendProcess
    Wait-Ready "$apiUrl/api/v1/health"
    $env:GEOVR_API_URL = $apiUrl
    $frontendProcess = Start-Process -FilePath $nodePath -ArgumentList @(('"' + $vitePath + '"'), '--host', '127.0.0.1', '--port', "$chosenWebPort", '--strictPort') -WorkingDirectory $frontendDirectory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDirectory 'frontend.log') -RedirectStandardError (Join-Path $runtimeDirectory 'frontend.error.log')
    $started += $frontendProcess
    Wait-Ready "$webUrl/api/v1/health"
    $processes = @(Get-CimInstance Win32_Process)
    $managedIds = @($started | ForEach-Object { $_.Id })
    do {
        $children = @($processes | Where-Object { $_.ParentProcessId -in $managedIds -and $_.ProcessId -notin $managedIds })
        $managedIds += @($children | ForEach-Object { [int]$_.ProcessId })
    } while ($children.Count -gt 0)
    $records = @($managedIds | ForEach-Object {
        $process = Get-Process -Id $_ -ErrorAction SilentlyContinue
        if ($process) { @{ Id = $process.Id; StartTime = $process.StartTime.ToUniversalTime().ToString('o') } }
    })
    @{ WebUrl = $webUrl; ApiUrl = $apiUrl; Processes = $records } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $statePath -Encoding UTF8
    Write-Output "Frontend: $webUrl"
    Write-Output "API docs: $apiUrl/docs"
    Write-Output "Logs: $runtimeDirectory"
} catch {
    foreach ($process in $started) {
        if (!$process.HasExited) { Stop-Process -InputObject $process -Force -ErrorAction SilentlyContinue }
    }
    throw
} finally {
    $env:GEOVR_API_URL = $previousApiUrl
}
