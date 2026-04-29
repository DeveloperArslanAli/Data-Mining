"""Simple backend endpoint connectivity checks.
Run: python test_backend_endpoints.py
Assumes backend running on localhost:8090.
"""
import requests, sys, json, time

BASE = "http://localhost:8090"
API = f"{BASE}/api/v1"

def check(name, method, url, **kw):
    try:
        resp = requests.request(method, url, timeout=5, **kw)
        print(f"[OK ] {name}: {resp.status_code}")
        if resp.status_code >= 400:
            print("      Body:", resp.text[:300])
        return resp
    except Exception as e:
        print(f"[ERR] {name}: {e}")
        return None

def main():
    print("=== Connectivity Smoke Test ===")
    # 1 Health
    health = check("health", "GET", f"{BASE}/health")
    if not health:
        print("Backend not reachable on 8000 (connection refused). Start it first.")
        sys.exit(1)

    # 2 Try dev bootstrap (only if debug)
    payload = {
        "email": "smoketest@example.com",
        "username": "smoketest",
        "password": "SmokeTest123",
        "full_name": "Smoke Test",
        "role": "data_scientist"
    }
    bootstrap = check("dev_bootstrap_user", "POST", f"{API}/auth/dev-bootstrap-user", json=payload)
    token = None
    if bootstrap and bootstrap.ok:
        try:
            token = bootstrap.json()["access_token"]
        except Exception:
            pass

    # 3 Login (will work if user created)
    login = check("login", "POST", f"{API}/auth/login", json={"email": payload["email"], "password": payload["password"]})
    if not token and login and login.ok:
        try:
            token = login.json()["access_token"]
        except Exception:
            pass

    headers = {"Authorization": f"Bearer {token}"} if token else {}

    # 4 Current user
    if headers:
        check("me", "GET", f"{API}/auth/me", headers=headers)
        # 5 Refresh
        check("refresh", "POST", f"{API}/auth/refresh", headers=headers)

    # 6 Non-auth endpoint examples (adjust as implemented)
    check("datasets list", "GET", f"{API}/datasets")

    print("=== Done ===")

if __name__ == "__main__":
    main()
