# Run backend locally without docker (PowerShell)
$env:ENVIRONMENT = 'development'
$env:DEBUG = 'true'
$env:SECRET_KEY = 'dev-secret-key-change-me-please-1234567890abcd'
$env:DATABASE_URL = 'sqlite:///./dev.db'
$env:REDIS_URL = 'redis://localhost:6379'

Write-Host 'Starting FastAPI backend on http://localhost:8090'
python -m uvicorn main:app --host 0.0.0.0 --port 8090 --reload
