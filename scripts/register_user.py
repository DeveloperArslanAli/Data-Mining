"""
Quick registration smoke test against local backend.
Usage: python scripts/register_user.py
"""
import requests
import random
import string

BASE = "http://localhost:8090"
API = f"{BASE}/api/v1"


def random_user(prefix: str = "user"):
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    u = f"{prefix}_{suffix}"
    return {
        "email": f"{u}@example.com",
        "username": u,
        "password": "Password123",
        "full_name": "Test User",
        "role": "data_scientist",
    }


def main():
    try:
        h = requests.get(f"{BASE}/health", timeout=5)
        print("/health:", h.status_code, h.text[:120])
    except Exception as e:
        print("Health check failed:", e)
        return

    payload = random_user()
    print("Registering:", payload["email"], payload["username"])    
    try:
        r = requests.post(f"{API}/auth/register", json=payload, timeout=15)
        print("/auth/register:", r.status_code)
        print(r.text[:400])
    except Exception as e:
        print("Registration request failed:", e)


if __name__ == "__main__":
    main()
