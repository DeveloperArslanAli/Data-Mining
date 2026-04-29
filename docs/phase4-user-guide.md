# Phase 4: Enterprise Features User Guide

## 📋 Overview

Phase 4 introduces enterprise-grade features to the Data Mining Platform, including advanced ML capabilities, performance optimization, enterprise security, and workflow automation. This guide covers all new features and how to use them effectively.

## 🚀 New Features

### 1. Advanced ML Model Management

#### Creating and Managing ML Models

**Creating a New Model:**
```bash
POST /api/v1/ml-models/
{
  "name": "Customer Churn Prediction",
  "description": "Predicts customer churn using historical data",
  "model_type": "classification",
  "framework": "scikit-learn",
  "algorithm": "RandomForest",
  "target_column": "churn",
  "training_dataset_id": 123,
  "training_params": {
    "n_estimators": 100,
    "max_depth": 10,
    "random_state": 42
  }
}
```

**Training a Model:**
```bash
POST /api/v1/ml-models/{model_id}/train
{
  "hyperparameters": {
    "n_estimators": 200,
    "max_depth": 15
  },
  "validation_split": 0.2,
  "cross_validation_folds": 5
}
```

**Deploying a Model:**
```bash
POST /api/v1/ml-models/{model_id}/deploy
{
  "deployment_name": "churn-prediction-api",
  "deployment_type": "api",
  "scaling_config": {
    "min_instances": 1,
    "max_instances": 5
  }
}
```

**Making Predictions:**
```bash
POST /api/v1/ml-models/{model_id}/predict
{
  "input_data": {
    "customer_id": 12345,
    "age": 35,
    "tenure": 24,
    "monthly_charges": 79.99
  }
}
```

#### Model Versioning and Lifecycle Management

- **Version Control**: Each model maintains version history with rollback capabilities
- **Performance Monitoring**: Track model performance and detect drift
- **A/B Testing**: Compare model versions side-by-side
- **Automated Retraining**: Schedule automatic model retraining based on performance thresholds

### 2. AutoML Capabilities

#### Running AutoML Pipeline

**Basic AutoML:**
```bash
POST /api/v1/automl/run
{
  "dataset_id": "123",
  "target_column": "target",
  "problem_type": "classification",
  "max_training_time": 3600,
  "cv_folds": 5,
  "feature_engineering": true,
  "hyperparameter_tuning": true
}
```

**Custom Algorithm Selection:**
```bash
POST /api/v1/automl/run
{
  "dataset_id": "123",
  "target_column": "target",
  "problem_type": "classification",
  "algorithms": ["random_forest", "xgboost", "lightgbm"],
  "max_training_time": 1800
}
```

#### AutoML Features

- **Automated Feature Engineering**: Automatic feature creation and selection
- **Hyperparameter Optimization**: Grid search and random search
- **Model Selection**: Automatic algorithm selection based on data characteristics
- **Performance Comparison**: Side-by-side comparison of multiple models

### 3. Performance Optimization

#### Caching System

**Using Cache in API Calls:**
```python
from backend.app.core.performance import cached

@cached(ttl=3600, key_prefix="dataset_")
async def get_dataset_analysis(dataset_id: int):
    # Expensive computation
    return analysis_result
```

**Cache Management:**
```bash
# Get cache statistics
GET /api/v1/performance/cache/stats

# Clear cache
DELETE /api/v1/performance/cache/clear
```

#### Database Optimization

**Query Performance Analysis:**
```bash
POST /api/v1/performance/analyze-query
{
  "query": "SELECT * FROM datasets WHERE owner_id = ?",
  "params": [123]
}
```

**Index Creation:**
```bash
POST /api/v1/performance/create-index
{
  "table": "datasets",
  "columns": ["owner_id", "created_at"],
  "index_name": "idx_datasets_owner_created"
}
```

### 4. Enterprise Security

#### Single Sign-On (SSO) Integration

**SAML Configuration:**
```bash
POST /api/v1/security/sso/configure
{
  "provider_type": "saml",
  "config": {
    "entity_id": "your-entity-id",
    "sso_url": "https://sso.company.com/saml",
    "certificate": "-----BEGIN CERTIFICATE-----...",
    "acs_url": "https://app.company.com/saml/acs"
  }
}
```

**OAuth2 Configuration:**
```bash
POST /api/v1/security/sso/configure
{
  "provider_type": "oauth2",
  "config": {
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "authorization_url": "https://oauth.company.com/authorize",
    "token_url": "https://oauth.company.com/token",
    "user_info_url": "https://oauth.company.com/userinfo"
  }
}
```

#### Role-Based Access Control (RBAC)

**User Roles:**
- **Admin**: Full system access
- **Data Scientist**: ML model management, advanced analytics
- **Business Analyst**: Data analysis, reporting
- **Researcher**: Data access, basic ML features

**Permission Checking:**
```python
from backend.app.core.enterprise_security import check_permission, Permission

# Check if user can deploy models
if check_permission(user, Permission.MODEL_DEPLOY):
    # Allow model deployment
    pass
```

#### Audit Logging

**Viewing Audit Logs:**
```bash
GET /api/v1/security/audit-logs?user_id=123&start_date=2024-01-01&end_date=2024-01-31
```

**Audit Log Features:**
- Complete user activity tracking
- Compliance reporting
- Security event monitoring
- Data access logging

### 5. Workflow Automation

#### Creating Custom Workflows

**Workflow Definition:**
```bash
POST /api/v1/workflows/
{
  "name": "Daily Data Processing Pipeline",
  "description": "Automated daily data processing and model retraining",
  "workflow_definition": {
    "nodes": [
      {
        "id": "data_input",
        "type": "data_input",
        "config": {
          "source_type": "dataset",
          "source_id": 123
        },
        "is_start": true
      },
      {
        "id": "data_cleaning",
        "type": "data_cleaning",
        "config": {
          "operations": ["remove_duplicates", "handle_missing"]
        }
      },
      {
        "id": "model_training",
        "type": "ml_training",
        "config": {
          "model_type": "classification",
          "algorithm": "random_forest",
          "target_column": "target"
        }
      },
      {
        "id": "model_deployment",
        "type": "ml_deployment",
        "config": {
          "deployment_name": "daily-model",
          "replace_existing": true
        }
      }
    ],
    "connections": [
      {"from": "data_input", "to": "data_cleaning"},
      {"from": "data_cleaning", "to": "model_training"},
      {"from": "model_training", "to": "model_deployment"}
    ]
  }
}
```

#### Scheduling Workflows

**Cron-based Scheduling:**
```bash
POST /api/v1/workflows/{workflow_id}/schedule
{
  "cron_expression": "0 2 * * *",  // Daily at 2 AM
  "timezone": "UTC",
  "input_data": {
    "dataset_id": 123,
    "model_config": {
      "algorithm": "xgboost",
      "n_estimators": 200
    }
  }
}
```

**Event-based Triggers:**
```bash
POST /api/v1/workflows/{workflow_id}/triggers
{
  "trigger_type": "webhook",
  "webhook_url": "https://app.company.com/webhook/data-updated",
  "conditions": {
    "dataset_updated": true,
    "file_size_greater_than": "100MB"
  }
}
```

#### Workflow Node Types

**Available Node Types:**
- **Data Input**: Load data from various sources
- **Data Processing**: Transform and clean data
- **ML Training**: Train machine learning models
- **ML Prediction**: Make predictions using trained models
- **Data Cleaning**: Apply data quality operations
- **Data Export**: Export processed data
- **Condition**: Conditional branching logic
- **Loop**: Iterative processing
- **Parallel**: Parallel execution
- **Notification**: Send notifications
- **Webhook**: Call external APIs

### 6. Advanced Analytics and Reporting

#### Custom Dashboards

**Creating Analytics Dashboard:**
```bash
POST /api/v1/analytics/dashboards/
{
  "name": "ML Model Performance Dashboard",
  "description": "Monitor ML model performance and drift",
  "widgets": [
    {
      "type": "line_chart",
      "title": "Model Accuracy Over Time",
      "data_source": "model_metrics",
      "x_axis": "date",
      "y_axis": "accuracy"
    },
    {
      "type": "bar_chart",
      "title": "Model Usage by Type",
      "data_source": "model_usage",
      "group_by": "model_type"
    }
  ]
}
```

#### Performance Monitoring

**System Metrics:**
```bash
GET /api/v1/analytics/performance/system
```

**Model Performance:**
```bash
GET /api/v1/analytics/performance/models?model_id=123&start_date=2024-01-01
```

**User Activity:**
```bash
GET /api/v1/analytics/performance/users?user_id=123&period=30d
```

## 🔧 Configuration

### Environment Variables

**Performance Settings:**
```bash
# Redis configuration for caching
REDIS_URL=redis://localhost:6379

# Database connection pool
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30

# Cache settings
CACHE_DEFAULT_TTL=3600
CACHE_MAX_SIZE=1000
```

**Security Settings:**
```bash
# JWT configuration
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600

# SSO configuration
SAML_ENTITY_ID=your-entity-id
OAUTH2_CLIENT_ID=your-client-id
```

**ML Engine Settings:**
```bash
# ML Engine service
ML_ENGINE_URL=http://localhost:8001
ML_ENGINE_TIMEOUT=300

# Model storage
MODEL_STORAGE_PATH=/app/models
MODEL_CACHE_SIZE=100
```

### Docker Configuration

**Production Docker Compose:**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - REDIS_URL=redis://redis:6379
      - ML_ENGINE_URL=http://ml-engine:8001
    depends_on:
      - redis
      - ml-engine
  
  ml-engine:
    build: ./services/ml-engine
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
  
  redis:
    image: redis:6-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
```

## 📊 Best Practices

### ML Model Management

1. **Model Versioning**: Always version your models and document changes
2. **Performance Monitoring**: Set up alerts for model drift and performance degradation
3. **A/B Testing**: Test new models against production models before full deployment
4. **Automated Retraining**: Schedule regular model retraining based on data freshness

### Performance Optimization

1. **Caching Strategy**: Cache frequently accessed data and expensive computations
2. **Database Indexing**: Create appropriate indexes for common query patterns
3. **Query Optimization**: Monitor and optimize slow database queries
4. **Resource Monitoring**: Track system resources and scale accordingly

### Security

1. **Least Privilege**: Grant users only the permissions they need
2. **Audit Logging**: Enable comprehensive audit logging for compliance
3. **SSO Integration**: Use enterprise SSO for centralized authentication
4. **Regular Security Reviews**: Conduct regular security assessments

### Workflow Automation

1. **Modular Design**: Create reusable workflow components
2. **Error Handling**: Implement proper error handling and retry logic
3. **Monitoring**: Monitor workflow execution and set up alerts for failures
4. **Documentation**: Document workflow purposes and dependencies

## 🚨 Troubleshooting

### Common Issues

**Model Training Failures:**
- Check dataset size and format
- Verify training parameters
- Monitor system resources during training

**Performance Issues:**
- Check cache hit rates
- Analyze database query performance
- Monitor system resource usage

**Authentication Problems:**
- Verify SSO configuration
- Check user permissions
- Review audit logs for access attempts

**Workflow Execution Failures:**
- Check node configurations
- Verify data dependencies
- Review execution logs

### Getting Help

1. **Documentation**: Check the comprehensive API documentation
2. **Logs**: Review application logs for detailed error information
3. **Support**: Contact your system administrator for enterprise support
4. **Community**: Join the user community for peer support

## 📈 Monitoring and Alerts

### Key Metrics to Monitor

**System Performance:**
- API response times
- Database query performance
- Cache hit rates
- Memory and CPU usage

**ML Model Performance:**
- Model accuracy and drift
- Prediction latency
- Model usage statistics
- Training time and success rates

**Security:**
- Failed authentication attempts
- Permission violations
- Unusual user activity
- System access patterns

### Setting Up Alerts

**Performance Alerts:**
```bash
POST /api/v1/monitoring/alerts/
{
  "name": "High API Response Time",
  "condition": "api_response_time > 5.0",
  "threshold": 5.0,
  "notification_channels": ["email", "slack"]
}
```

**Model Performance Alerts:**
```bash
POST /api/v1/monitoring/alerts/
{
  "name": "Model Drift Detection",
  "condition": "model_drift_score > 0.1",
  "threshold": 0.1,
  "notification_channels": ["email"]
}
```

## 🎯 Next Steps

### Phase 5 Planning

Phase 5 will introduce:
- AI-powered data discovery and cataloging
- Real-time streaming data processing
- Advanced visualization and BI integration
- Multi-tenant architecture with data isolation
- Advanced collaboration features

### Feature Requests

To request new features:
1. Submit feature requests through the user portal
2. Participate in user surveys and feedback sessions
3. Join the beta testing program for early access to new features

---

**Last Updated**: December 2024  
**Version**: Phase 4.0  
**Status**: Production Ready
