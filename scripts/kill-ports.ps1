param(
  [Parameter()]
  [object]$Ports = @(3050,8090)
)

# Normalize $Ports into an [int[]]
if ($Ports -is [string]) {
  $Ports = $Ports -split '[,\s]+' | Where-Object { $_ } | ForEach-Object { [int]$_ }
} elseif ($Ports -is [int]) {
  $Ports = @([int]$Ports)
} elseif ($Ports -is [object[]]) {
  $Ports = $Ports | ForEach-Object {
    if ($_ -is [string]) { [int]$_ } else { [int]$_ }
  }
}

function Kill-Port($Port) {
  try {
    $listeners = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
    if ($listeners) {
      $pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
      foreach ($procId in $pids) {
        Write-Host "Killing PID $procId on port $Port"
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      }
    } else {
      # Fallback using netstat for older systems
      $lines = netstat -ano | Select-String ":$Port\s+LISTENING" | ForEach-Object { $_.ToString() }
      foreach ($line in $lines) {
        $parts = $line -split "\s+"
        $procIdFromNetstat = $parts[-1]
        if ($procIdFromNetstat -match '^\d+$') {
          Write-Host "Killing PID $procIdFromNetstat on port $Port (netstat)"
          Stop-Process -Id [int]$procIdFromNetstat -Force -ErrorAction SilentlyContinue
        }
      }
    }
  } catch {
    Write-Warning "Failed to kill port ${Port}: $($_)"
  }
}

foreach ($p in $Ports) { Kill-Port -Port $p }

Write-Host "Ports cleared: $($Ports -join ', ')"
