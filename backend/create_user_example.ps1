# Usage: .\create_user_example.ps1 -Email "abc@gmail.com" -Username "Arslan" -Password "abc123"
param(
  [string]$Email = "abc@gmail.com",
  [string]$Username = "Arslan",
  [string]$Password = "abc123"
)

$body = @{
  email = $Email
  username = $Username
  password = $Password
  full_name = $Username
  role = "data_scientist"
} | ConvertTo-Json

Write-Host "Posting dev bootstrap user..."
try {
  $resp = Invoke-RestMethod -Method Post -Uri "http://localhost:8090/api/v1/auth/dev-bootstrap-user" -ContentType 'application/json' -Body $body
  Write-Host "Created/Loaded user:" ($resp.user.email)
  Write-Host "Access token (truncated):" ($resp.access_token.Substring(0,40) + '...')
} catch {
  Write-Error $_
}
