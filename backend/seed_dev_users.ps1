# Seed multiple dev users using the /auth/dev-bootstrap-user endpoint
# Requires backend running with DEBUG=true on http://localhost:8090

$users = @(
  @{ email = 'abc@gmail.com'; username = 'Arslan'; password = 'abc123'; full_name = 'Arslan'; role='data_scientist' },
  @{ email = 'Sample@gmail.com'; username = 'Sample'; password = 'Sample123'; full_name = 'Sample User'; role='data_scientist' }
)

foreach ($u in $users) {
  Write-Host "Seeding user" $u.email
  $body = $u | ConvertTo-Json
  try {
  $resp = Invoke-RestMethod -Method Post -Uri 'http://localhost:8090/api/v1/auth/dev-bootstrap-user' -ContentType 'application/json' -Body $body
    Write-Host "  -> OK user_id=" $resp.user.id " email=" $resp.user.email
  } catch {
    Write-Warning "  -> Failed: $_"
  }
}
