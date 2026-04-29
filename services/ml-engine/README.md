# ML Engine Service

The ML Engine Service is a dedicated microservice for data processing, cleaning, and ML-powered analysis. It provides comprehensive data quality assessment, cleaning operations, and intelligent suggestions for data scientists and analysts.

## Features

### 🧹 Data Cleaning Operations
- **Remove Duplicates**: Identify and remove duplicate rows with configurable criteria
- **Handle Missing Values**: Multiple strategies (auto, mean, median, mode, drop, interpolate)
- **Remove Outliers**: IQR, Z-score, and Isolation Forest methods
- **Data Normalization**: Standard and Min-Max scaling
- **Categorical Encoding**: Label and One-Hot encoding

### 📊 Data Quality Assessment
- **Comprehensive Analysis**: Missing values, duplicates, outliers, data types
- **Quality Scoring**: Automated quality score calculation (0-100)
- **Statistical Summary**: Descriptive statistics and correlation analysis
- **Recommendations**: AI-powered suggestions for data improvement

### 🤖 ML-Powered Suggestions
- **Feature Engineering**: Automatic suggestions for data transformations
- **Model Optimization**: Feature selection and preprocessing recommendations
- **Quality Improvements**: Prioritized suggestions based on data analysis
- **Performance Insights**: Expected impact and confidence scoring

## Architecture

```
services/ml-engine/
├── app/
│   ├── api/v1/endpoints/     # REST API endpoints
│   │   ├── cleaning.py       # Data cleaning operations
│   │   ├── quality.py        # Quality assessment
│   │   └── suggestions.py    # ML suggestions
│   ├── core/                 # Core configuration
│   │   ├── config.py         # Settings and configuration
│   │   ├── logging.py        # Structured logging
│   │   └── cache.py          # Redis caching utilities
│   └── ml/                   # ML algorithms
│       └── data_processor.py # Core data processing logic
├── main.py                   # FastAPI application entry
├── requirements.txt          # Python dependencies
├── Dockerfile               # Production Docker image
├── Dockerfile.dev           # Development Docker image
└── test_ml_engine.py        # Test suite
```

## API Endpoints

### Cleaning Operations
- `POST /api/v1/cleaning/process` - Process cleaning operations
- `GET /api/v1/cleaning/quality/{file_path}` - Get data quality assessment
- `GET /api/v1/cleaning/operations` - List supported operations

### Quality Assessment
- `GET /api/v1/quality/assess/{file_path}` - Comprehensive quality assessment
- `GET /api/v1/quality/summary/{file_path}` - Quick quality summary
- `GET /api/v1/quality/missing-values/{file_path}` - Missing values analysis
- `GET /api/v1/quality/outliers/{file_path}` - Outliers analysis
- `GET /api/v1/quality/data-types/{file_path}` - Data type analysis

### ML Suggestions
- `POST /api/v1/suggestions/generate` - Generate ML-powered suggestions

## Quick Start

### Development Setup

1. **Install Dependencies**
```bash
cd services/ml-engine
pip install -r requirements.txt
```

2. **Run the Service**
```bash
python main.py
```

3. **Test the Service**
```bash
python test_ml_engine.py
```

### Docker Setup

1. **Build and Run**
```bash
docker build -f Dockerfile.dev -t ml-engine-dev .
docker run -p 8001:8001 ml-engine-dev
```

2. **Using Docker Compose**
```bash
docker-compose up ml-engine
```

## Configuration

### Environment Variables

```bash
# Service Configuration
BACKEND_HOST=0.0.0.0
ML_ENGINE_PORT=8001

# Storage Configuration
STORAGE_PATH=./storage
TEMP_PATH=./storage/temp
MODEL_PATH=./storage/models
CACHE_PATH=./storage/cache

# ML Configuration
MAX_DATASET_SIZE=1073741824  # 1GB
MAX_MEMORY_USAGE=8589934592  # 8GB
PROCESSING_TIMEOUT=300       # 5 minutes

# Redis Configuration
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600              # 1 hour

# AI/ML Configuration
OPENAI_API_KEY=your_openai_key
OLLAMA_BASE_URL=http://localhost:11434
MODEL_NAME=llama2
```

## Usage Examples

### Data Quality Assessment

```python
import httpx

async def assess_quality(file_path: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"http://localhost:8001/api/v1/quality/assess/{file_path}")
        return response.json()

# Usage
quality_report = await assess_quality("dataset.csv")
print(f"Quality Score: {quality_report['quality_score']}/100")
```

### Cleaning Operation

```python
async def clean_data(file_path: str, operation_type: str):
    payload = {
        "file_path": file_path,
        "operation_type": operation_type,
        "parameters": {"strategy": "auto"},
        "target_columns": []
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post("http://localhost:8001/api/v1/cleaning/process", json=payload)
        return response.json()

# Usage
result = await clean_data("dataset.csv", "handle_missing_values")
print(f"Quality improvement: {result['quality_improvement']}")
```

### ML Suggestions

```python
async def get_suggestions(file_path: str, target_column: str = None):
    payload = {
        "file_path": file_path,
        "target_column": target_column,
        "task_type": "regression",  # or "classification", "clustering"
        "max_suggestions": 10
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post("http://localhost:8001/api/v1/suggestions/generate", json=payload)
        return response.json()

# Usage
suggestions = await get_suggestions("dataset.csv", "target")
for suggestion in suggestions['suggestions']:
    print(f"- {suggestion['title']}: {suggestion['description']}")
```

## Performance Optimization

### Caching Strategy
- **Quality Assessments**: Cached for 30 minutes
- **Cleaning Results**: Cached for 1 hour
- **ML Suggestions**: Cached for 15 minutes

### Memory Management
- **Streaming Processing**: Large datasets processed in chunks
- **Memory Limits**: Configurable memory usage limits
- **Garbage Collection**: Automatic cleanup of temporary data

### Scalability
- **Async Processing**: Non-blocking operations
- **Background Tasks**: Long-running operations in background
- **Horizontal Scaling**: Stateless design for easy scaling

## Testing

### Run Test Suite
```bash
python test_ml_engine.py
```

### Test Coverage
- Data processor functionality
- API endpoints
- Error handling
- Performance benchmarks
- Integration tests

## Monitoring

### Health Checks
- `GET /health` - Service health status
- `GET /` - Service information

### Metrics
- Processing times
- Memory usage
- Cache hit rates
- Error rates

### Logging
- Structured logging with JSON format
- Request/response logging
- Error tracking
- Performance monitoring

## Integration

### Backend Integration
The ML Engine Service integrates seamlessly with the main backend:

1. **Cleaning Operations**: Backend calls ML Engine for actual processing
2. **Quality Assessment**: Real-time quality analysis
3. **ML Suggestions**: AI-powered recommendations

### Frontend Integration
Frontend components can directly call ML Engine endpoints for:
- Real-time data quality assessment
- Interactive cleaning operations
- ML suggestion display

## Troubleshooting

### Common Issues

1. **Memory Errors**
   - Reduce `MAX_DATASET_SIZE`
   - Increase `MAX_MEMORY_USAGE`
   - Use streaming for large files

2. **Timeout Errors**
   - Increase `PROCESSING_TIMEOUT`
   - Check dataset size
   - Monitor system resources

3. **Redis Connection Errors**
   - Verify `REDIS_URL` configuration
   - Check Redis service status
   - Test network connectivity

### Debug Mode
```bash
export LOG_LEVEL=DEBUG
python main.py
```

## Contributing

1. Follow the existing code structure
2. Add comprehensive tests
3. Update documentation
4. Follow PEP 8 style guidelines
5. Add type hints for all functions

## License

This service is part of the Data Mining Platform and follows the same license terms.
