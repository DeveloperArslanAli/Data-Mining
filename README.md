# Data Mining Platform

A comprehensive web-based data mining platform with AI/ML-powered cleaning and smart suggestions for data scientists, business analysts, and researchers.

## 🎯 Project Overview

This platform provides:
- **Web Data Mining**: Deep crawling & scraping capabilities
- **AI/ML-Powered Cleaning**: Auto-detect noise, missing values, duplicates, outliers
- **Smart ML Suggestions**: Data transformations, normalization, feature engineering hints
- **Multi-Format Export**: CSV, XML, SQL (with DB schema generation)

## 🏗️ Architecture

### Frontend (Next.js + Tailwind)
- Modern React components for file preview, cleaning steps, export settings
- Server-side rendering for performance
- Responsive design with Tailwind CSS

### Backend (FastAPI + Node.js)
- **FastAPI (Python)**: AI/ML pipeline for cleaning and suggestions
- **Node.js (Express)**: Data mining and crawling modules
- **PostgreSQL**: Metadata storage and job logs

### AI/ML Engine
- **Pandas + Scikit-learn**: Data preprocessing and cleaning
- **spaCy/LLM API**: Text mining and NLP cleaning
- **ML Pipeline**: Sklearn pipelines for transformations

### Deployment
- Dockerized microservices architecture
- Cloud-ready for GCP/AWS deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 13+
- Docker & Docker Compose

### Development Setup

1. **Clone and Setup**
```bash
git clone <repository-url>
cd data-mining-platform
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

4. **Database Setup**
```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres
```

5. **Run Development Servers**
```bash
# Backend (FastAPI)
cd backend && uvicorn main:app --reload --port 8000

# Frontend (Next.js)
cd frontend && npm run dev

# Node.js Crawling Service
cd services/crawling && npm run dev
```

## 📁 Project Structure

```
data-mining-platform/
├── docs/                    # Documentation
├── frontend/               # Next.js frontend
├── backend/                # FastAPI backend
├── services/               # Microservices
│   ├── crawling/          # Node.js crawling service
│   └── ml-engine/         # Python ML engine
├── config/                 # Configuration files
├── scripts/               # Utility scripts
├── tests/                 # Test suites
└── docker-compose.yml     # Docker orchestration
```

## 🔧 Configuration

Environment variables are managed through `.env` files in each service directory. See `config/` for templates.

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Architecture Design](./docs/architecture.md)
- [Development Guide](./docs/development.md)
- [Deployment Guide](./docs/deployment.md)
- [User Guide](./docs/user-guide.md)

## 🧪 Testing

```bash
# Run all tests
npm run test:all

# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && pytest

# Integration tests
npm run test:integration
```

## 🚀 Deployment

```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# Development
docker-compose up -d
```

## 📊 Monitoring

- **Application**: Prometheus + Grafana
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Health Checks**: Built-in health endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the [documentation](./docs/)
- Review the [FAQ](./docs/faq.md)

## 🧭 Systematic Troubleshooting Workflow

Use this sequence when "connection refused" or auth failures occur.

### 1. Environment Sanity
| Target | Check | Command / Action | Expected |
|--------|-------|------------------|----------|
| Python version | `python --version` | >=3.10 | OK |
| Node version | `node --version` | >=18 | OK |
| Port 8000 free | (Windows) `netstat -ano | findstr :8000` | No stale process | Free |
| Port 3000 free | Same for 3000 | No stale process | Free |

### 2. Start Backend (No Docker)
```
cd backend
pip install -r requirements.txt
set SECRET_KEY=dev-secret-key-change-me-please-1234567890abcd
set DATABASE_URL=sqlite:///./dev.db
uvicorn main:app --reload --port 8000
```
Health check:
```
curl http://localhost:8090/health
```
Expect JSON with status "healthy".

### 3. Smoke Test Endpoints
Run automated script:
```
python backend/test_backend_endpoints.py
```
Fix any [ERR] lines before moving on.

### 4. Bootstrap Dev Users
```
cd backend
python test_backend_endpoints.py   # also creates smoketest user (DEBUG only)
PowerShell: .\create_user_example.ps1
PowerShell: .\seed_dev_users.ps1
```

### 5. Start Frontend
```
cd frontend
npm install
npm run dev
```
Open http://localhost:3050 and register or login.

### 6. Diagnose Connection Refused
| Symptom | Likely Cause | Resolution |
|---------|--------------|------------|
| ERR_CONNECTION_REFUSED to :8000 | Backend not running | Start backend (Step 2) |
| 404 /auth/dev-bootstrap-user | DEBUG False | Ensure DEBUG true / dev run |
| 500 Failed to register user | DB unreachable or SECRET_KEY too short | Provide valid DATABASE_URL & long SECRET_KEY |
| HMR websocket failures | Frontend not started / crashed | Re-run `npm run dev` |

### 7. Common Pitfalls
* Docker daemon not running -> compose ps errors; run locally first.
* Duplicate /api/v1 in base URL -> fixed via normalization in `frontend/src/lib/api.ts`.
* Stale .next build -> remove `frontend/.next` and restart dev.

### 8. Minimal Manual API Flow
```
curl -X POST http://localhost:8090/api/v1/auth/dev-bootstrap-user \
	-H "Content-Type: application/json" \
	-d '{"email":"quick@example.com","username":"quickuser","password":"QuickPass123","full_name":"Quick User","role":"data_scientist"}'

curl -X POST http://localhost:8090/api/v1/auth/login \
	-H "Content-Type: application/json" \
	-d '{"email":"quick@example.com","password":"QuickPass123"}'
```

### 9. Escalation Data to Collect
If issues persist, capture:
```
python backend/test_backend_endpoints.py > connectivity.log
docker compose logs backend (if using docker)
Browser Network tab HAR for failing request
```
Attach these when opening an issue.

