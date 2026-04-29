# System Architecture

## 🏗️ High-Level Architecture

The Data Mining Platform follows a microservices architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Services      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Redis Cache   │    │   File Storage  │
│   (Metadata)    │    │   (Sessions)    │    │   (Datasets)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Component Overview

### Frontend Layer (Next.js)
- **Technology**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Purpose**: User interface, data visualization, workflow management
- **Key Features**:
  - Server-side rendering for performance
  - Real-time data preview and editing
  - Interactive cleaning workflow
  - Responsive design for all devices

### Backend Layer (FastAPI)
- **Technology**: FastAPI, Python 3.9+, SQLAlchemy, Pydantic
- **Purpose**: API gateway, business logic, AI/ML pipeline orchestration
- **Key Features**:
  - RESTful API with OpenAPI documentation
  - JWT authentication and authorization
  - Data validation and sanitization
  - AI/ML pipeline management

### Services Layer (Node.js)
- **Technology**: Node.js 18+, Express, Puppeteer, Cheerio
- **Purpose**: Web crawling, data extraction, file processing
- **Key Features**:
  - Multi-threaded web crawling
  - Data extraction from various formats
  - Rate limiting and ethical scraping
  - File format conversion

### Data Layer
- **PostgreSQL**: Metadata storage, job logs, user data
- **Redis**: Session management, caching, job queues
- **File Storage**: Dataset storage, temporary files, exports

## 🔄 Data Flow Architecture

### 1. Data Ingestion Flow
```
User Input → Frontend → Backend API → Crawling Service → Data Validation → Storage
```

### 2. Data Processing Flow
```
Stored Data → ML Engine → Quality Assessment → Cleaning Suggestions → User Review → Cleaned Data
```

### 3. Export Flow
```
Cleaned Data → Format Conversion → Validation → File Generation → Download
```

## 🏛️ Detailed Component Design

### Frontend Components

#### Core Components
```typescript
// DataUpload.tsx - File upload and URL input
interface DataUploadProps {
  onDataReceived: (data: Dataset) => void;
  supportedFormats: string[];
}

// DataPreview.tsx - Real-time data preview
interface DataPreviewProps {
  data: Dataset;
  onEdit: (changes: DataChanges) => void;
}

// CleaningWorkflow.tsx - Interactive cleaning interface
interface CleaningWorkflowProps {
  dataset: Dataset;
  suggestions: CleaningSuggestion[];
  onApply: (operations: CleaningOperation[]) => void;
}

// ExportSettings.tsx - Export configuration
interface ExportSettingsProps {
  data: Dataset;
  onExport: (config: ExportConfig) => void;
}
```

#### State Management
```typescript
// Store structure using Zustand
interface AppState {
  currentDataset: Dataset | null;
  cleaningHistory: CleaningOperation[];
  exportConfig: ExportConfig;
  userPreferences: UserPreferences;
}
```

### Backend API Design

#### Core Endpoints
```python
# Data Management
POST   /api/v1/datasets/upload
GET    /api/v1/datasets/{id}
PUT    /api/v1/datasets/{id}
DELETE /api/v1/datasets/{id}

# Data Processing
POST   /api/v1/datasets/{id}/analyze
POST   /api/v1/datasets/{id}/clean
GET    /api/v1/datasets/{id}/suggestions

# Export
POST   /api/v1/datasets/{id}/export
GET    /api/v1/exports/{id}/download

# Crawling
POST   /api/v1/crawl
GET    /api/v1/crawl/{id}/status
GET    /api/v1/crawl/{id}/results
```

#### Data Models
```python
# Pydantic models for API
class Dataset(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    source_type: SourceType
    data_schema: Dict[str, DataType]
    created_at: datetime
    updated_at: datetime

class CleaningSuggestion(BaseModel):
    operation_type: CleaningOperationType
    confidence: float
    description: str
    parameters: Dict[str, Any]
    affected_columns: List[str]

class ExportConfig(BaseModel):
    format: ExportFormat
    encoding: str = "utf-8"
    delimiter: str = ","
    include_metadata: bool = True
```

### Services Architecture

#### Crawling Service
```javascript
// Crawling service structure
class CrawlingService {
  async crawlWebsite(config: CrawlConfig): Promise<CrawlResult> {
    // Multi-threaded crawling with rate limiting
  }
  
  async extractData(html: string, selectors: SelectorConfig): Promise<ExtractedData> {
    // Data extraction using Cheerio
  }
  
  async validateData(data: ExtractedData): Promise<ValidationResult> {
    // Data validation and quality checks
  }
}
```

#### ML Engine Service
```python
# ML Engine service structure
class MLEngine:
    def analyze_quality(self, dataset: Dataset) -> QualityReport:
        """Analyze data quality and generate report"""
        
    def suggest_cleaning(self, dataset: Dataset) -> List[CleaningSuggestion]:
        """Generate cleaning suggestions based on data analysis"""
        
    def apply_cleaning(self, dataset: Dataset, operations: List[CleaningOperation]) -> Dataset:
        """Apply cleaning operations to dataset"""
```

## 🔐 Security Architecture

### Authentication & Authorization
- **JWT-based authentication** with refresh tokens
- **Role-based access control** (RBAC)
- **API rate limiting** to prevent abuse
- **Input validation and sanitization** at all layers

### Data Security
- **Data encryption** at rest and in transit
- **Secure file upload** with virus scanning
- **Audit logging** for all operations
- **GDPR compliance** with data retention policies

### Network Security
- **HTTPS/TLS** for all communications
- **CORS configuration** for frontend-backend communication
- **API key management** for external integrations
- **DDoS protection** and rate limiting

## 📊 Database Schema

### Core Tables
```sql
-- Users and authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Datasets
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    source_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500),
    data_schema JSONB,
    row_count INTEGER,
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Cleaning operations
CREATE TABLE cleaning_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES datasets(id),
    operation_type VARCHAR(100) NOT NULL,
    parameters JSONB,
    applied_at TIMESTAMP DEFAULT NOW()
);

-- Export jobs
CREATE TABLE export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES datasets(id),
    user_id UUID REFERENCES users(id),
    format VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

## 🚀 Deployment Architecture

### Development Environment
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Services      │
│   (localhost:3050)│  │   (localhost:8090)│  │   (localhost:3001)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   (localhost:5432)│
                    └─────────────────┘
```

### Production Environment
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   CDN          │    │   Monitoring    │
│   (Nginx)       │    │   (CloudFlare) │    │   (Prometheus)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Services      │
│   (Kubernetes)  │    │   (Kubernetes)  │    │   (Kubernetes)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────┐
                    │   Database      │
                    │   (Cloud SQL)   │
                    └─────────────────┘
```

## 🔧 Configuration Management

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/datamining
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600

# Services
CRAWLING_SERVICE_URL=http://localhost:3001
ML_ENGINE_URL=http://localhost:8001

# File Storage
STORAGE_PATH=/app/storage
MAX_FILE_SIZE=1073741824  # 1GB

# External APIs
OPENAI_API_KEY=your-openai-key
```

### Docker Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
  - NEXT_PUBLIC_API_URL=http://localhost:8090
      
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/datamining
      
  crawling-service:
    build: ./services/crawling
    ports:
      - "3001:3001"
      
  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=datamining
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
```

## 📈 Scalability Considerations

### Horizontal Scaling
- **Stateless services** for easy replication
- **Load balancing** across multiple instances
- **Database read replicas** for read-heavy workloads
- **CDN integration** for static assets

### Performance Optimization
- **Caching strategy** with Redis
- **Database indexing** for query optimization
- **Async processing** for long-running tasks
- **File compression** for large datasets

### Monitoring & Observability
- **Application metrics** with Prometheus
- **Log aggregation** with ELK stack
- **Health checks** for all services
- **Alerting** for critical issues
