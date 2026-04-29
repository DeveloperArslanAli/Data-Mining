# Development Guide

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Python 3.9+** - [Download](https://www.python.org/)
- **PostgreSQL 13+** - [Download](https://www.postgresql.org/)
- **Docker & Docker Compose** - [Download](https://www.docker.com/)
- **Git** - [Download](https://git-scm.com/)

### Development Environment Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd data-mining-platform
```

#### 2. Backend Setup (FastAPI)
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start development server
uvicorn main:app --reload --port 8000
```

#### 3. Frontend Setup (Next.js)
```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

#### 4. Services Setup (Node.js)
```bash
cd services/crawling

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

#### 5. Database Setup
```bash
# Using Docker
docker-compose up -d postgres redis

# Or install locally
# PostgreSQL setup instructions...
```

## 📁 Project Structure

```
data-mining-platform/
├── docs/                          # Documentation
│   ├── api.md                     # API documentation
│   ├── architecture.md            # System architecture
│   ├── development-guide.md       # This file
│   ├── deployment-guide.md        # Deployment instructions
│   └── user-guide.md              # User documentation
├── frontend/                      # Next.js frontend
│   ├── components/                # React components
│   ├── pages/                     # Next.js pages
│   ├── lib/                       # Utility libraries
│   ├── styles/                    # CSS styles
│   ├── types/                     # TypeScript types
│   └── package.json
├── backend/                       # FastAPI backend
│   ├── app/                       # Application code
│   │   ├── api/                   # API routes
│   │   ├── core/                  # Core configuration
│   │   ├── models/                # Database models
│   │   ├── services/              # Business logic
│   │   └── utils/                 # Utilities
│   ├── alembic/                   # Database migrations
│   ├── tests/                     # Test files
│   └── requirements.txt
├── services/                      # Microservices
│   ├── crawling/                  # Web crawling service
│   │   ├── src/                   # Source code
│   │   ├── tests/                 # Tests
│   │   └── package.json
│   └── ml-engine/                 # ML engine service
│       ├── src/                   # Source code
│       ├── tests/                 # Tests
│       └── requirements.txt
├── config/                        # Configuration files
│   ├── docker-compose.yml         # Docker orchestration
│   ├── docker-compose.prod.yml    # Production Docker setup
│   └── nginx.conf                 # Nginx configuration
├── scripts/                       # Utility scripts
│   ├── setup.sh                   # Development setup
│   ├── deploy.sh                  # Deployment script
│   └── test.sh                    # Test runner
└── tests/                         # Integration tests
    ├── e2e/                       # End-to-end tests
    ├── integration/               # Integration tests
    └── performance/               # Performance tests
```

## 🛠️ Development Workflow

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature description"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
# Merge after review
```

### Code Standards

#### Python (Backend)
```python
# Use Black for formatting
black app/

# Use isort for import sorting
isort app/

# Use flake8 for linting
flake8 app/

# Type hints are required
def process_data(data: List[Dict[str, Any]]) -> ProcessedData:
    """Process the input data and return processed result."""
    pass
```

#### TypeScript (Frontend)
```typescript
// Use Prettier for formatting
npm run format

// Use ESLint for linting
npm run lint

// Type definitions are required
interface DataProcessingProps {
  data: Dataset;
  onComplete: (result: ProcessedData) => void;
}

const DataProcessing: React.FC<DataProcessingProps> = ({ data, onComplete }) => {
  // Component implementation
};
```

#### JavaScript (Services)
```javascript
// Use Prettier for formatting
npm run format

// Use ESLint for linting
npm run lint

// JSDoc comments for functions
/**
 * Process web crawling request
 * @param {CrawlConfig} config - Crawling configuration
 * @returns {Promise<CrawlResult>} Crawling result
 */
async function processCrawl(config) {
  // Implementation
}
```

### Testing Standards

#### Backend Testing
```python
# Unit tests with pytest
pytest tests/unit/

# Integration tests
pytest tests/integration/

# API tests
pytest tests/api/

# Coverage report
pytest --cov=app tests/
```

#### Frontend Testing
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

#### Services Testing
```bash
# Crawling service tests
cd services/crawling && npm test

# ML engine tests
cd services/ml-engine && pytest tests/
```

## 🔧 Development Tools

### VS Code Extensions
```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.black-formatter",
    "ms-python.isort",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-azuretools.vscode-docker"
  ]
}
```

### Pre-commit Hooks
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        language_version: python3.9
  
  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort
  
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.38.0
    hooks:
      - id: eslint
        files: \.(js|ts|tsx)$
```

## 📊 Database Development

### Migration Workflow
```bash
# Create new migration
alembic revision --autogenerate -m "Add new table"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Check migration status
alembic current
```

### Database Seeding
```python
# Create seed data
python scripts/seed_data.py

# Reset database
python scripts/reset_db.py
```

## 🔍 Debugging

### Backend Debugging
```python
# Add debugger
import pdb; pdb.set_trace()

# Or use ipdb for better experience
import ipdb; ipdb.set_trace()

# Logging
import logging
logger = logging.getLogger(__name__)
logger.debug("Debug message")
logger.info("Info message")
logger.error("Error message")
```

### Frontend Debugging
```typescript
// Console logging
console.log('Debug info:', data);
console.error('Error:', error);

// React DevTools
// Install React Developer Tools browser extension

// Debugger statement
debugger;
```

### API Testing
```bash
# Test API endpoints
curl -X GET http://localhost:8090/api/v1/health

# Test with authentication
curl -X GET http://localhost:8090/api/v1/datasets \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test file upload
curl -X POST http://localhost:8090/api/v1/datasets/upload \
  -F "file=@data.csv" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚀 Performance Optimization

### Backend Optimization
```python
# Database query optimization
# Use select() to limit fields
users = db.query(User).options(selectinload(User.datasets)).all()

# Use async operations for I/O
async def process_large_dataset(dataset_id: int):
    async with aiofiles.open(file_path, 'r') as f:
        content = await f.read()
    
# Use caching
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_calculation(data):
    return complex_operation(data)
```

### Frontend Optimization
```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{processData(data)}</div>;
});

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return expensiveProcessing(data);
}, [data]);

// Use useCallback for stable references
const handleDataChange = useCallback((newData) => {
  setData(newData);
}, []);
```

## 🔒 Security Best Practices

### Backend Security
```python
# Input validation
from pydantic import BaseModel, validator

class DatasetCreate(BaseModel):
    name: str
    description: Optional[str]
    
    @validator('name')
    def validate_name(cls, v):
        if len(v) < 1 or len(v) > 255:
            raise ValueError('Name must be between 1 and 255 characters')
        return v

# SQL injection prevention
# Use SQLAlchemy ORM instead of raw SQL
users = db.query(User).filter(User.email == email).first()

# XSS prevention
# Sanitize user input before rendering
from markupsafe import escape
safe_content = escape(user_content)
```

### Frontend Security
```typescript
// XSS prevention
// Use React's built-in XSS protection
const userContent = <div>{userInput}</div>;

// CSRF protection
// Include CSRF tokens in requests
const response = await fetch('/api/data', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});

// Input sanitization
import DOMPurify from 'dompurify';
const sanitizedInput = DOMPurify.sanitize(userInput);
```

## 📈 Monitoring & Logging

### Application Logging
```python
# Structured logging
import structlog

logger = structlog.get_logger()

logger.info("Processing dataset", 
           dataset_id=dataset.id, 
           user_id=user.id,
           operation="clean")
```

### Error Tracking
```typescript
// Frontend error tracking
import * as Sentry from "@sentry/nextjs";

Sentry.captureException(error, {
  extra: {
    userId: user.id,
    datasetId: dataset.id,
  },
});
```

### Health Checks
```python
# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }
```

## 🧪 Testing Strategies

### Unit Testing
```python
# Backend unit test example
import pytest
from unittest.mock import Mock, patch

def test_process_dataset():
    # Arrange
    mock_dataset = Mock()
    mock_dataset.id = 1
    
    # Act
    result = process_dataset(mock_dataset)
    
    # Assert
    assert result.status == "processed"
```

```typescript
// Frontend unit test example
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('should process data when button is clicked', async () => {
  // Arrange
  const mockOnProcess = jest.fn();
  render(<DataProcessor onProcess={mockOnProcess} />);
  
  // Act
  await userEvent.click(screen.getByRole('button', { name: /process/i }));
  
  // Assert
  expect(mockOnProcess).toHaveBeenCalled();
});
```

### Integration Testing
```python
# API integration test
def test_create_dataset(client, auth_headers):
    response = client.post(
        "/api/v1/datasets",
        json={"name": "Test Dataset", "description": "Test"},
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Test Dataset"
```

### E2E Testing
```typescript
// E2E test with Playwright
import { test, expect } from '@playwright/test';

test('complete data processing workflow', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="dataset-name"]', 'Test Dataset');
  await page.click('[data-testid="upload-button"]');
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

## 📚 Documentation Standards

### Code Documentation
```python
def process_dataset(dataset: Dataset) -> ProcessedResult:
    """
    Process a dataset through the cleaning pipeline.
    
    Args:
        dataset: The dataset to process
        
    Returns:
        ProcessedResult: The result of processing
        
    Raises:
        ValidationError: If dataset is invalid
        ProcessingError: If processing fails
    """
    pass
```

```typescript
/**
 * Process dataset through cleaning pipeline
 * @param dataset - The dataset to process
 * @returns Promise resolving to processed result
 * @throws {ValidationError} If dataset is invalid
 * @throws {ProcessingError} If processing fails
 */
async function processDataset(dataset: Dataset): Promise<ProcessedResult> {
  // Implementation
}
```

### API Documentation
```python
@app.post("/datasets", response_model=DatasetResponse)
async def create_dataset(
    dataset: DatasetCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new dataset.
    
    - **name**: Dataset name (required)
    - **description**: Optional description
    - **file**: Dataset file (CSV, JSON, etc.)
    
    Returns the created dataset with metadata.
    """
    pass
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Run tests
        run: |
          cd backend && pytest
          cd frontend && npm test
          cd services/crawling && npm test
```

This development guide provides comprehensive instructions for setting up and working with the Data Mining Platform. Follow these standards to maintain code quality and ensure smooth collaboration.
