import requests, json

BASE = "http://localhost:8090/api/v1"

payload = {
    "email": "testuser@example.com",
    "password": "TestPassword123!",
    "full_name": "Test User"
}

try:
    r = requests.post(f"{BASE}/auth/register", json=payload, timeout=5)
    print("Status:", r.status_code)
    print("Body:", r.text[:500])
except Exception as e:
    print("Request failed:", e)
