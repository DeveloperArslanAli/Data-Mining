# Phase 4: API Documentation

## 📋 Overview

This document provides comprehensive API documentation for Phase 4 enterprise features including ML model management, AutoML, performance optimization, enterprise security, and workflow automation.

## 🔐 Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Getting Authentication Token

```bash
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=your-email@example.com&password=your-password
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

## 🤖 ML Model Management API

### Create ML Model

```bash
POST /api/v1/ml-models/
```

**Request Body:**
```json
{
  "name": "Customer Churn Prediction",
  "description": "Predicts customer churn using historical data",
  "model_type": "classification",
  "framework": "scikit-learn",
  "algorithm": "RandomForest",
  "target_column": "churn",
  "training_dataset_id": 123,
  "validation_dataset_id": 124,
  "training_params": {
    "n_estimators": 100,
    "max_depth": 10,
    "random_state": 42
  },
  "auto_deploy": false
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Customer Churn Prediction",
  "version": "1.0.0",
  "model_type": "classification",
  "framework": "scikit-learn",
  "algorithm": "RandomForest",
  "status": "training",
  "is_production": false,
  "is_auto_retrain": false,
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z"
}
```

### Get ML Models

```bash
GET /api/v1/ml-models/?skip=0&limit=20&model_type=classification&status=trained
```

**Query Parameters:**
- `skip` (int): Number of records to skip (default: 0)
- `limit` (int): Maximum number of records to return (default: 20)
- `model_type` (string): Filter by model type (classification, regression, etc.)
- `status` (string): Filter by model status (training, trained, deployed, etc.)
- `framework` (string): Filter by ML framework

**Response:**
```json
{
  "models": [
    {
      "id": 1,
      "name": "Customer Churn Prediction",
      "version": "1.0.0",
      "model_type": "classification",
      "framework": "scikit-learn",
      "algorithm": "RandomForest",
      "status": "trained",
      "accuracy": 0.85,
      "precision": 0.82,
      "recall": 0.88,
      "f1_score": 0.85,
      "created_at": "2024-12-01T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20,
  "pages": 1
}
```

### Get ML Model by ID

```bash
GET /api/v1/ml-models/{model_id}
```

**Response:**
```json
{
  "id": 1,
  "name": "Customer Churn Prediction",
  "version": "1.0.0",
  "model_type": "classification",
  "framework": "scikit-learn",
  "algorithm": "RandomForest",
  "status": "trained",
  "is_production": false,
  "is_auto_retrain": false,
  "accuracy": 0.85,
  "precision": 0.82,
  "recall": 0.88,
  "f1_score": 0.85,
  "validation_score": 0.85,
  "training_samples": 10000,
  "training_duration": 120.5,
  "training_params": {
    "n_estimators": 100,
    "max_depth": 10
  },
  "deployment_url": null,
  "deployed_at": null,
  "prediction_count": 0,
  "last_prediction_at": null,
  "model_drift_score": null,
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z",
  "trained_at": "2024-12-01T10:05:00Z"
}
```

### Train ML Model

```bash
POST /api/v1/ml-models/{model_id}/train
```

**Request Body:**
```json
{
  "hyperparameters": {
    "n_estimators": 200,
    "max_depth": 15,
    "min_samples_split": 5
  },
  "validation_split": 0.2,
  "cross_validation_folds": 5,
  "optimization_metric": "accuracy"
}
```

**Response:**
```json
{
  "id": 1,
  "model_id": 1,
  "job_name": "Training Customer Churn Prediction",
  "job_type": "training",
  "status": "pending",
  "progress": 0.0,
  "created_at": "2024-12-01T10:00:00Z"
}
```

### Deploy ML Model

```bash
POST /api/v1/ml-models/{model_id}/deploy
```

**Request Body:**
```json
{
  "deployment_name": "churn-prediction-api",
  "deployment_type": "api",
  "scaling_config": {
    "min_instances": 1,
    "max_instances": 5,
    "target_cpu_utilization": 70
  },
  "health_check_config": {
    "enabled": true,
    "interval": 30,
    "timeout": 10
  },
  "monitoring_config": {
    "enable_metrics": true,
    "enable_logging": true
  }
}
```

**Response:**
```json
{
  "deployment_id": "deploy-123",
  "deployment_url": "https://api.example.com/models/1/predict",
  "status": "deployed",
  "deployed_at": "2024-12-01T10:00:00Z",
  "health_status": "healthy",
  "scaling_info": {
    "current_instances": 1,
    "min_instances": 1,
    "max_instances": 5
  }
}
```

### Make Prediction

```bash
POST /api/v1/ml-models/{model_id}/predict
```

**Request Body:**
```json
{
  "input_data": {
    "customer_id": 12345,
    "age": 35,
    "tenure": 24,
    "monthly_charges": 79.99,
    "total_charges": 1919.76
  },
  "request_id": "req-123",
  "actual_value": null
}
```

**Response:**
```json
{
  "id": 1,
  "model_id": 1,
  "input_data": {
    "customer_id": 12345,
    "age": 35,
    "tenure": 24,
    "monthly_charges": 79.99,
    "total_charges": 1919.76
  },
  "prediction": {
    "predicted_class": 1,
    "probability": 0.85,
    "confidence": 0.85
  },
  "confidence": 0.85,
  "actual_value": null,
  "prediction_time": 0.05,
  "request_id": "req-123",
  "created_at": "2024-12-01T10:00:00Z"
}
```

### Get Model Predictions

```bash
GET /api/v1/ml-models/{model_id}/predictions?skip=0&limit=50
```

**Response:**
```json
{
  "predictions": [
    {
      "id": 1,
      "model_id": 1,
      "input_data": {...},
      "prediction": {...},
      "confidence": 0.85,
      "prediction_time": 0.05,
      "created_at": "2024-12-01T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "size": 50
}
```

### Get Model Performance

```bash
GET /api/v1/ml-models/{model_id}/performance
```

**Response:**
```json
{
  "model_id": 1,
  "performance_metrics": {
    "accuracy": 0.85,
    "precision": 0.82,
    "recall": 0.88,
    "f1_score": 0.85
  },
  "prediction_count": 1000,
  "last_prediction_at": "2024-12-01T10:00:00Z",
  "model_drift_score": 0.05,
  "is_production": true,
  "deployment_status": "deployed"
}
```

### Compare Models

```bash
POST /api/v1/ml-models/compare
```

**Request Body:**
```json
{
  "model_ids": [1, 2, 3],
  "comparison_metrics": ["accuracy", "precision", "recall", "f1_score"],
  "test_dataset_id": 125
}
```

**Response:**
```json
{
  "comparison_id": "comp-123",
  "models": [
    {
      "id": 1,
      "name": "Model 1",
      "metrics": {
        "accuracy": 0.85,
        "precision": 0.82,
        "recall": 0.88,
        "f1_score": 0.85
      }
    }
  ],
  "metrics_comparison": {
    "accuracy": {
      "1": 0.85,
      "2": 0.82,
      "3": 0.88
    }
  },
  "best_model_id": 3,
  "comparison_date": "2024-12-01T10:00:00Z",
  "recommendations": [
    "Model 3 has the highest accuracy",
    "Consider ensemble methods for better performance"
  ]
}
```

## 🧠 AutoML API

### Run AutoML Pipeline

```bash
POST /api/v1/automl/run
```

**Request Body:**
```json
{
  "dataset_id": "123",
  "target_column": "target",
  "problem_type": "classification",
  "max_training_time": 3600,
  "cv_folds": 5,
  "optimization_metric": "auto",
  "feature_engineering": true,
  "hyperparameter_tuning": true,
  "algorithms": ["random_forest", "xgboost", "lightgbm"]
}
```

**Response:**
```json
{
  "job_id": "automl-123",
  "status": "completed",
  "best_model": {
    "name": "xgboost",
    "cv_score": 0.88,
    "cv_std": 0.02,
    "best_params": {
      "n_estimators": 200,
      "learning_rate": 0.1,
      "max_depth": 6
    },
    "additional_metrics": {
      "accuracy": 0.88,
      "precision": 0.85,
      "recall": 0.91,
      "f1_score": 0.88
    }
  },
  "all_models": [
    {
      "name": "random_forest",
      "cv_score": 0.85,
      "cv_std": 0.03,
      "training_time": 120.5
    },
    {
      "name": "xgboost",
      "cv_score": 0.88,
      "cv_std": 0.02,
      "training_time": 95.2
    }
  ],
  "feature_importance": {
    "feature_1": 0.25,
    "feature_2": 0.20,
    "feature_3": 0.15
  },
  "recommendations": [
    "Best performing model: xgboost with CV score: 0.88",
    "Consider ensemble methods for better performance"
  ],
  "total_training_time": 360.7,
  "optimization_metric": "accuracy",
  "cv_folds": 5,
  "completed_at": "2024-12-01T10:00:00Z"
}
```

### Get AutoML Results

```bash
GET /api/v1/automl/results/{job_id}
```

**Response:**
```json
{
  "job_id": "automl-123",
  "status": "completed",
  "best_model": {...},
  "all_models": [...],
  "feature_importance": {...},
  "recommendations": [...],
  "total_training_time": 360.7
}
```

### Compare Models

```bash
POST /api/v1/automl/compare-models
```

**Request Body:**
```json
{
  "dataset_id": "123",
  "target_column": "target",
  "problem_type": "classification",
  "model_configs": [
    {
      "model_name": "random_forest",
      "params": {
        "n_estimators": 100,
        "max_depth": 10
      }
    },
    {
      "model_name": "xgboost",
      "params": {
        "n_estimators": 200,
        "learning_rate": 0.1
      }
    }
  ],
  "cv_folds": 5
}
```

**Response:**
```json
{
  "comparison_id": "comp-456",
  "best_model": {
    "model_name": "xgboost",
    "cv_score": 0.88,
    "cv_std": 0.02
  },
  "all_results": [
    {
      "model_name": "random_forest",
      "params": {...},
      "cv_score": 0.85,
      "cv_std": 0.03,
      "additional_metrics": {...}
    }
  ],
  "summary": {
    "total_models": 2,
    "best_score": 0.88,
    "score_range": {
      "min": 0.85,
      "max": 0.88
    }
  },
  "recommendations": [
    "Best performing model: xgboost with score: 0.88",
    "Performance varies significantly (std: 0.03)"
  ],
  "completed_at": "2024-12-01T10:00:00Z"
}
```

### Get Available Algorithms

```bash
GET /api/v1/automl/available-algorithms
```

**Response:**
```json
{
  "algorithms": {
    "classification": [
      "random_forest",
      "gradient_boosting",
      "logistic_regression",
      "svm",
      "knn",
      "naive_bayes",
      "decision_tree",
      "xgboost",
      "lightgbm"
    ],
    "regression": [
      "random_forest",
      "gradient_boosting",
      "linear_regression",
      "ridge",
      "lasso",
      "svr",
      "knn",
      "decision_tree",
      "xgboost",
      "lightgbm"
    ]
  },
  "hyperparameter_grids": {
    "random_forest": ["n_estimators", "max_depth", "min_samples_split"],
    "xgboost": ["n_estimators", "learning_rate", "max_depth"]
  },
  "feature_engineering_methods": [
    "polynomial_features",
    "interaction_features",
    "binning",
    "scaling",
    "encoding"
  ]
}
```

### Hyperparameter Tuning

```bash
POST /api/v1/automl/hyperparameter-tuning
```

**Request Body:**
```json
{
  "dataset_id": "123",
  "target_column": "target",
  "model_name": "random_forest",
  "problem_type": "classification",
  "param_grid": {
    "n_estimators": [50, 100, 200],
    "max_depth": [10, 20, 30],
    "min_samples_split": [2, 5, 10]
  },
  "cv_folds": 5,
  "optimization_metric": "accuracy"
}
```

**Response:**
```json
{
  "model_name": "random_forest",
  "best_params": {
    "n_estimators": 200,
    "max_depth": 20,
    "min_samples_split": 5
  },
  "best_score": 0.87,
  "cv_results": {
    "mean_test_score": [0.82, 0.85, 0.87, 0.84, 0.86],
    "std_test_score": [0.02, 0.03, 0.02, 0.03, 0.02],
    "params": [
      {"n_estimators": 50, "max_depth": 10, "min_samples_split": 2},
      {"n_estimators": 100, "max_depth": 20, "min_samples_split": 5}
    ]
  },
  "optimization_metric": "accuracy",
  "cv_folds": 5
}
```

## ⚡ Performance API

### Get Cache Statistics

```bash
GET /api/v1/performance/cache/stats
```

**Response:**
```json
{
  "hits": 1250,
  "misses": 150,
  "sets": 200,
  "deletes": 10,
  "hit_rate": 89.29,
  "total_requests": 1400,
  "memory_cache_size": 0
}
```

### Clear Cache

```bash
DELETE /api/v1/performance/cache/clear?pattern=*
```

**Query Parameters:**
- `pattern` (string): Cache key pattern to clear (default: "*")

**Response:**
```json
{
  "message": "Cache cleared successfully",
  "keys_deleted": 150
}
```

### Analyze Query Performance

```bash
POST /api/v1/performance/analyze-query
```

**Request Body:**
```json
{
  "query": "SELECT * FROM datasets WHERE owner_id = ? AND created_at > ?",
  "params": [123, "2024-01-01"]
}
```

**Response:**
```json
{
  "query": "SELECT * FROM datasets WHERE owner_id = ? AND created_at > ?",
  "execution_plan": [
    {
      "Node Type": "Seq Scan",
      "Relation Name": "datasets",
      "Total Cost": 1000.0,
      "Actual Total Time": 50.0
    }
  ],
  "analysis": {
    "total_cost": 1000.0,
    "execution_time": 50.0,
    "operations": ["Seq Scan"],
    "index_usage": [],
    "table_scans": ["datasets"],
    "joins": []
  },
  "recommendations": [
    "Consider adding indexes for tables: datasets",
    "Query has high cost. Consider optimizing joins and adding indexes."
  ]
}
```

### Create Database Index

```bash
POST /api/v1/performance/create-index
```

**Request Body:**
```json
{
  "table": "datasets",
  "columns": ["owner_id", "created_at"],
  "index_name": "idx_datasets_owner_created"
}
```

**Response:**
```json
{
  "message": "Index created successfully",
  "table": "datasets",
  "columns": ["owner_id", "created_at"],
  "index_name": "idx_datasets_owner_created"
}
```

### Get Performance Statistics

```bash
GET /api/v1/performance/stats?function_name=dataset_analysis
```

**Query Parameters:**
- `function_name` (string): Specific function to get stats for (optional)

**Response:**
```json
{
  "dataset_analysis": {
    "execution_time": {
      "count": 100,
      "min": 0.5,
      "max": 5.2,
      "avg": 2.1,
      "latest": 1.8
    }
  }
}
```

## 🔒 Enterprise Security API

### Configure SSO Provider

```bash
POST /api/v1/security/sso/configure
```

**Request Body:**
```json
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

**Response:**
```json
{
  "message": "SSO provider configured successfully",
  "provider_type": "saml",
  "entity_id": "your-entity-id"
}
```

### SAML Authentication

```bash
POST /api/v1/security/sso/saml/authenticate
```

**Request Body:**
```json
{
  "saml_response": "base64-encoded-saml-response"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "email": "user@company.com",
    "username": "user",
    "full_name": "John Doe",
    "role": "data_scientist"
  }
}
```

### OAuth2 Authentication

```bash
POST /api/v1/security/sso/oauth2/authenticate
```

**Request Body:**
```json
{
  "code": "authorization-code",
  "state": "random-state-string"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "email": "user@company.com",
    "username": "user",
    "full_name": "John Doe",
    "role": "data_scientist"
  }
}
```

### Get User Permissions

```bash
GET /api/v1/security/permissions
```

**Response:**
```json
{
  "permissions": [
    "dataset:read",
    "dataset:write",
    "dataset:delete",
    "model:read",
    "model:write",
    "model:delete",
    "model:deploy",
    "user:read",
    "system:monitor"
  ],
  "role": "data_scientist"
}
```

### Get Audit Logs

```bash
GET /api/v1/security/audit-logs?user_id=123&start_date=2024-01-01&end_date=2024-01-31&action=dataset_upload
```

**Query Parameters:**
- `user_id` (int): Filter by user ID (optional)
- `start_date` (string): Start date filter (ISO format)
- `end_date` (string): End date filter (ISO format)
- `action` (string): Filter by action type (optional)

**Response:**
```json
{
  "audit_logs": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "user_id": 123,
      "action": "dataset_upload",
      "resource": "dataset",
      "details": {
        "dataset_id": 456,
        "file_size": "1.2MB"
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0..."
    }
  ],
  "total": 1,
  "page": 1,
  "size": 50
}
```

## 🔄 Workflow Automation API

### Create Workflow

```bash
POST /api/v1/workflows/
```

**Request Body:**
```json
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
      }
    ],
    "connections": [
      {"from": "data_input", "to": "data_cleaning"},
      {"from": "data_cleaning", "to": "model_training"}
    ]
  },
  "trigger_config": {
    "type": "scheduled",
    "cron_expression": "0 2 * * *"
  },
  "variables": {
    "model_name": "daily-model",
    "retrain_threshold": 0.1
  }
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Daily Data Processing Pipeline",
  "description": "Automated daily data processing and model retraining",
  "version": "1.0.0",
  "status": "draft",
  "is_template": false,
  "is_public": false,
  "max_concurrent_executions": 1,
  "timeout_seconds": 3600,
  "retry_count": 3,
  "retry_delay_seconds": 60,
  "execution_count": 0,
  "success_count": 0,
  "failure_count": 0,
  "average_execution_time": null,
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z",
  "last_executed_at": null
}
```

### Get Workflows

```bash
GET /api/v1/workflows/?skip=0&limit=20&status=active
```

**Query Parameters:**
- `skip` (int): Number of records to skip (default: 0)
- `limit` (int): Maximum number of records to return (default: 20)
- `status` (string): Filter by workflow status
- `is_template` (boolean): Filter by template status

**Response:**
```json
{
  "workflows": [
    {
      "id": 1,
      "name": "Daily Data Processing Pipeline",
      "version": "1.0.0",
      "status": "active",
      "execution_count": 10,
      "success_count": 9,
      "failure_count": 1,
      "success_rate": 90.0,
      "last_executed_at": "2024-12-01T02:00:00Z",
      "created_at": "2024-12-01T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20,
  "pages": 1
}
```

### Execute Workflow

```bash
POST /api/v1/workflows/{workflow_id}/execute
```

**Request Body:**
```json
{
  "input_data": {
    "dataset_id": 123,
    "model_config": {
      "algorithm": "xgboost",
      "n_estimators": 200
    }
  },
  "trigger_type": "manual",
  "trigger_data": {
    "triggered_by": "user",
    "reason": "manual_execution"
  }
}
```

**Response:**
```json
{
  "execution_id": "exec-123",
  "workflow_id": 1,
  "status": "running",
  "trigger_type": "manual",
  "current_node": "data_input",
  "start_time": "2024-12-01T10:00:00Z",
  "created_at": "2024-12-01T10:00:00Z"
}
```

### Get Workflow Execution Status

```bash
GET /api/v1/workflows/executions/{execution_id}
```

**Response:**
```json
{
  "execution_id": "exec-123",
  "workflow_id": 1,
  "status": "completed",
  "trigger_type": "manual",
  "current_node": null,
  "completed_nodes": ["data_input", "data_cleaning", "model_training"],
  "failed_nodes": [],
  "start_time": "2024-12-01T10:00:00Z",
  "end_time": "2024-12-01T10:05:00Z",
  "execution_time": 300.0,
  "error_message": null,
  "created_at": "2024-12-01T10:00:00Z"
}
```

### Schedule Workflow

```bash
POST /api/v1/workflows/{workflow_id}/schedule
```

**Request Body:**
```json
{
  "cron_expression": "0 2 * * *",
  "timezone": "UTC",
  "input_data": {
    "dataset_id": 123,
    "model_config": {
      "algorithm": "random_forest",
      "n_estimators": 100
    }
  },
  "variables": {
    "model_name": "scheduled-model"
  },
  "max_executions": null
}
```

**Response:**
```json
{
  "id": 1,
  "workflow_id": 1,
  "name": "Scheduled Daily Data Processing Pipeline",
  "cron_expression": "0 2 * * *",
  "timezone": "UTC",
  "is_active": true,
  "max_executions": null,
  "execution_count": 0,
  "created_at": "2024-12-01T10:00:00Z",
  "next_execution_at": "2024-12-02T02:00:00Z"
}
```

### Get Scheduled Jobs

```bash
GET /api/v1/workflows/scheduled-jobs/?workflow_id=1&is_active=true
```

**Query Parameters:**
- `workflow_id` (int): Filter by workflow ID (optional)
- `is_active` (boolean): Filter by active status (optional)

**Response:**
```json
{
  "scheduled_jobs": [
    {
      "id": 1,
      "workflow_id": 1,
      "name": "Scheduled Daily Data Processing Pipeline",
      "cron_expression": "0 2 * * *",
      "timezone": "UTC",
      "is_active": true,
      "execution_count": 5,
      "last_executed_at": "2024-12-01T02:00:00Z",
      "next_execution_at": "2024-12-02T02:00:00Z",
      "created_at": "2024-12-01T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

## 📊 Analytics API

### Get System Performance Metrics

```bash
GET /api/v1/analytics/performance/system?period=7d
```

**Query Parameters:**
- `period` (string): Time period (1d, 7d, 30d, 90d)

**Response:**
```json
{
  "period": "7d",
  "metrics": {
    "api_response_time": {
      "avg": 0.5,
      "p95": 1.2,
      "p99": 2.5
    },
    "database_query_time": {
      "avg": 0.1,
      "p95": 0.3,
      "p99": 0.8
    },
    "cache_hit_rate": 0.89,
    "memory_usage": {
      "avg": 0.65,
      "max": 0.85
    },
    "cpu_usage": {
      "avg": 0.45,
      "max": 0.75
    }
  },
  "trends": {
    "api_response_time": "stable",
    "database_query_time": "improving",
    "cache_hit_rate": "stable"
  }
}
```

### Get Model Performance Analytics

```bash
GET /api/v1/analytics/performance/models?model_id=1&period=30d
```

**Response:**
```json
{
  "model_id": 1,
  "period": "30d",
  "metrics": {
    "prediction_count": 10000,
    "avg_prediction_time": 0.05,
    "accuracy_trend": [
      {"date": "2024-11-01", "accuracy": 0.85},
      {"date": "2024-11-02", "accuracy": 0.86}
    ],
    "drift_score": 0.05,
    "usage_by_hour": [
      {"hour": 0, "predictions": 50},
      {"hour": 1, "predictions": 30}
    ]
  },
  "alerts": [
    {
      "type": "drift_detected",
      "message": "Model drift detected: 0.05",
      "severity": "warning",
      "timestamp": "2024-12-01T10:00:00Z"
    }
  ]
}
```

### Get User Activity Analytics

```bash
GET /api/v1/analytics/performance/users?user_id=123&period=7d
```

**Response:**
```json
{
  "user_id": 123,
  "period": "7d",
  "activity": {
    "total_requests": 500,
    "unique_sessions": 25,
    "avg_session_duration": 1800,
    "most_used_endpoints": [
      {"endpoint": "/api/v1/ml-models/", "count": 100},
      {"endpoint": "/api/v1/datasets/", "count": 80}
    ],
    "activity_by_day": [
      {"date": "2024-11-25", "requests": 70},
      {"date": "2024-11-26", "requests": 85}
    ]
  },
  "performance": {
    "avg_response_time": 0.4,
    "error_rate": 0.02
  }
}
```

## 🚨 Error Responses

All API endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid request parameters",
  "error_code": "INVALID_PARAMETERS",
  "timestamp": "2024-12-01T10:00:00Z"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid authentication credentials",
  "error_code": "UNAUTHORIZED",
  "timestamp": "2024-12-01T10:00:00Z"
}
```

### 403 Forbidden
```json
{
  "detail": "Insufficient permissions",
  "error_code": "FORBIDDEN",
  "timestamp": "2024-12-01T10:00:00Z"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found",
  "error_code": "NOT_FOUND",
  "timestamp": "2024-12-01T10:00:00Z"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error",
  "error_code": "INTERNAL_ERROR",
  "timestamp": "2024-12-01T10:00:00Z"
}
```

## 📝 Rate Limiting

API endpoints are rate-limited to ensure fair usage:

- **Authentication endpoints**: 10 requests per minute
- **ML model endpoints**: 100 requests per minute
- **AutoML endpoints**: 5 requests per minute
- **Performance endpoints**: 200 requests per minute
- **Security endpoints**: 50 requests per minute
- **Workflow endpoints**: 50 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🔄 Webhooks

### Webhook Configuration

```bash
POST /api/v1/webhooks/
```

**Request Body:**
```json
{
  "name": "Model Training Complete",
  "url": "https://your-app.com/webhooks/model-training",
  "events": ["model.training.completed", "model.training.failed"],
  "secret": "webhook-secret-key",
  "is_active": true
}
```

### Webhook Payload Example

```json
{
  "event": "model.training.completed",
  "timestamp": "2024-12-01T10:00:00Z",
  "data": {
    "model_id": 1,
    "model_name": "Customer Churn Prediction",
    "training_time": 120.5,
    "accuracy": 0.85
  },
  "webhook_id": "webhook-123"
}
```

---

**Last Updated**: December 2024  
**Version**: Phase 4.0  
**Status**: Production Ready
