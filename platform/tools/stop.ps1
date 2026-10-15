$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$statePath = Join-Path $projectRoot '.runtime\servers.json'
if (!(Test-Path -LiteralPath $statePath)) {
    Write-Output 'No managed server state found.'
    exit 0
}
$state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
$records = @($state.Processes)
[array]::Reverse($records)
foreach ($record in $records) {
    $process = Get-Process -Id $record.Id -ErrorAction SilentlyContinue
    if ($process -and $process.StartTime.ToUniversalTime().Ticks -eq ([datetime]$record.StartTime).ToUniversalTime().Ticks) {
        Stop-Process -InputObject $process -Force
        Write-Output "Stopped managed process $($record.Id)."
    }
}
Remove-Item -LiteralPath $statePath
Write-Output 'Local servers stopped. Saved learning records are preserved.'
