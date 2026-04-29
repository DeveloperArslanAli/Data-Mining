# Backend Dev Quick Start

1. Ensure Docker (or local Postgres/Redis) running. For quick local test without docker, set:
   - DATABASE_URL=sqlite:///./dev.db (temporarily) and adjust config if needed.

2. Install deps:
   pip install -r requirements.txt

3. Run API:
   uvicorn main:app --reload --port 8000

4. Test health:
   curl http://localhost:8090/health

5. Test auth register (requires SECRET_KEY env >=32 chars):
   set SECRET_KEY=dev-secret-key-change-me-please-1234567890abcd
   python dev_check_auth.py

This file was auto-generated to assist debugging the registration issue (connection refused) indicating backend wasn’t running on port 8000 during frontend call.
