Param(
    [switch]$Reinstall
)

function Get-PythonLauncher {
    $candidates = @(
        @{ tokens = @('py','-3.11'); name = 'py -3.11' },
        @{ tokens = @('py','-3.10'); name = 'py -3.10' },
        @{ tokens = @('python');       name = 'python'    },
        @{ tokens = @('python3');      name = 'python3'   },
        @{ tokens = @('py','-3');      name = 'py -3'     }
    )
    foreach ($c in $candidates) {
        try {
            $exe = $c.tokens[0]
            $args = @()
            if ($c.tokens.Length -gt 1) { $args = $c.tokens[1..($c.tokens.Length-1)] }
            $out = & $exe @args -c "import sys; print(f'{sys.version_info[0]}.{sys.version_info[1]}')" 2>$null
            if ($LASTEXITCODE -eq 0 -and $out) {
                return @{ cmdTokens = $c.tokens; name = $c.name; version = $out.Trim() }
            }
        } catch { }
    }
    throw "No suitable Python found on PATH. Please install Python 3.11/3.10 and ensure 'python' is available."
}

Write-Host "[Step] Selecting Python version (prefer 3.11)"
$py = Get-PythonLauncher
Write-Host "[Info] Using Python launcher: $($py.name) (version $($py.version))"

Write-Host "[Step] Ensure Python venv exists (.venv)"
if ($Reinstall -and (Test-Path ".venv")) {
    Write-Host "[Info] Reinstall requested: removing existing .venv"
    Remove-Item -Recurse -Force .venv
}

# Recreate venv if version mismatch
if (Test-Path ".venv/Scripts/python.exe") {
    try {
        $venvPyVer = & ".venv/Scripts/python.exe" -c "import sys; print(f'{sys.version_info[0]}.{sys.version_info[1]}')"
        if ($venvPyVer -ne $py.version) {
            Write-Host "[Info] Existing venv is Python $venvPyVer, desired $($py.version). Recreating venv."
            Remove-Item -Recurse -Force .venv
        }
    } catch {
        Write-Host "[Warn] Failed to detect venv Python version. Recreating venv."
        Remove-Item -Recurse -Force .venv
    }
}

if (-not (Test-Path ".venv")) {
    Write-Host "[Step] Creating venv with $($py.name)"
    $exe = $py.cmdTokens[0]
    $args = @()
    if ($py.cmdTokens.Length -gt 1) { $args = $py.cmdTokens[1..($py.cmdTokens.Length-1)] }
    & $exe @args -m venv .venv
}

$venvActivate = Join-Path -Path ".venv" -ChildPath "Scripts\Activate.ps1"
. $venvActivate

Write-Host "[Step] Upgrade pip"
python -m pip install --upgrade pip

Write-Host "[Step] Install minimal server requirements"
pip install -r requirements-min-server.txt

Write-Host "[Info] Optionally installing extended dev requirements (can fail on Windows without build tools)"
try {
    pip install -r requirements-dev-sqlite.txt
} catch {
    Write-Warning "Extended dev requirements failed to install; continuing with minimal server set."
}

Write-Host "[Step] Set environment variables for dev (SQLite)"
$env:ENVIRONMENT = 'development'
$env:DEBUG = 'true'
$env:SECRET_KEY = 'dev-secret-key-change-me-please-1234567890abcd'
$env:DATABASE_URL = 'sqlite:///./dev.db'
$env:REDIS_URL = 'redis://localhost:6379'

Write-Host "[Step] Launching API on http://localhost:8090"
python -m uvicorn main:app --host 0.0.0.0 --port 8090 --reload
