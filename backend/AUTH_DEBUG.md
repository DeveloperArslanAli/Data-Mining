# Auth Debug Tips

Use these to isolate backend vs frontend issues.

## 1. Direct Register (curl)
```
curl -X POST http://localhost:8090/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"debug1@example.com","username":"debug_user1","password":"Password123","full_name":"Debug User","role":"data_scientist"}'
```
Expected: 200 with access_token & refresh_token. If 422, payload mismatch. If 500, check backend logs.

## 2. Duplicate User
Repeat the same request; expect 400 with detail about existing user.

## 3. Login Test
```
curl -X POST http://localhost:8090/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"debug1@example.com","password":"Password123"}'
```

## 4. Token Refresh
```
curl -X POST http://localhost:8090/api/v1/auth/refresh -H "Authorization: Bearer <access_token>"
```

## 5. Common Failures
- Connection refused: backend not running or wrong port.
- 500 Failed to register user + logs show JWT_SECRET error: ensure SECRET_KEY env var length >= 32.
- 500 DB errors: ensure database up & DATABASE_URL reachable.
- 422 username validation: underscores now allowed after recent schema update.
