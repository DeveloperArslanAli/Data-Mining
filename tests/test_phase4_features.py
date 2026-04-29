"""
Comprehensive test suite for Phase 4 features
"""

import pytest
import asyncio
import json
import time
from typing import Dict, List, Any
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np

from backend.main import app
from backend.app.core.database import get_db, engine
from backend.app.models.user import User, UserRole
from backend.app.models.ml_model import MLModel, ModelStatus, ModelType, ModelFramework
from backend.app.models.workflow import Workflow, WorkflowExecution, WorkflowStatus
from backend.app.core.performance import performance_monitor, cache_manager
from backend.app.core.enterprise_security import enterprise_security, Permission
from backend.app.services.workflow_engine import workflow_engine


class TestPhase4Features:
    """Test suite for Phase 4 enterprise features"""
    
    @pytest.fixture(autouse=True)
    def setup_database(self):
        """Setup test database"""
        # Create test database tables
        from backend.app.core.database import Base
        Base.metadata.create_all(bind=engine)
        yield
        # Cleanup
        Base.metadata.drop_all(bind=engine)
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def test_user(self, db: Session):
        """Create test user"""
        user = User(
            email="test@example.com",
            username="testuser",
            full_name="Test User",
            hashed_password="hashed_password",
            role=UserRole.DATA_SCIENTIST,
            is_active=True,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @pytest.fixture
    def auth_headers(self, client, test_user):
        """Get authentication headers"""
        # Login and get token
        response = client.post("/api/v1/auth/login", data={
            "username": test_user.email,
            "password": "test_password"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}


class TestMLModelManagement:
    """Test ML model management features"""
    
    def test_create_ml_model(self, client, auth_headers, test_user, db: Session):
        """Test creating ML model"""
        model_data = {
            "name": "Test Model",
            "description": "Test ML model",
            "model_type": "classification",
            "framework": "scikit-learn",
            "algorithm": "RandomForest",
            "target_column": "target",
            "training_dataset_id": 1,
            "training_params": {"n_estimators": 100}
        }
        
        response = client.post(
            "/api/v1/ml-models/",
            json=model_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Model"
        assert data["model_type"] == "classification"
        assert data["status"] == "training"
    
    def test_get_ml_models(self, client, auth_headers, test_user, db: Session):
        """Test getting ML models list"""
        # Create test model
        model = MLModel(
            name="Test Model",
            model_type=ModelType.CLASSIFICATION,
            framework=ModelFramework.SCIKIT_LEARN,
            algorithm="RandomForest",
            owner_id=test_user.id,
            status=ModelStatus.TRAINED
        )
        db.add(model)
        db.commit()
        
        response = client.get("/api/v1/ml-models/", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["models"]) == 1
        assert data["models"][0]["name"] == "Test Model"
    
    def test_model_training(self, client, auth_headers, test_user, db: Session):
        """Test model training"""
        # Create test model
        model = MLModel(
            name="Test Model",
            model_type=ModelType.CLASSIFICATION,
            framework=ModelFramework.SCIKIT_LEARN,
            algorithm="RandomForest",
            owner_id=test_user.id,
            status=ModelStatus.TRAINING
        )
        db.add(model)
        db.commit()
        
        training_config = {
            "hyperparameters": {"n_estimators": 100, "max_depth": 10},
            "validation_split": 0.2
        }
        
        response = client.post(
            f"/api/v1/ml-models/{model.id}/train",
            json=training_config,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "pending"
    
    def test_model_deployment(self, client, auth_headers, test_user, db: Session):
        """Test model deployment"""
        # Create trained model
        model = MLModel(
            name="Test Model",
            model_type=ModelType.CLASSIFICATION,
            framework=ModelFramework.SCIKIT_LEARN,
            algorithm="RandomForest",
            owner_id=test_user.id,
            status=ModelStatus.TRAINED,
            model_path="/path/to/model.pkl",
            validation_score=0.85
        )
        db.add(model)
        db.commit()
        
        deployment_config = {
            "deployment_name": "test-deployment",
            "deployment_type": "api",
            "scaling_config": {"min_instances": 1, "max_instances": 3}
        }
        
        response = client.post(
            f"/api/v1/ml-models/{model.id}/deploy",
            json=deployment_config,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "deployed"
        assert "deployment_url" in data
    
    def test_model_prediction(self, client, auth_headers, test_user, db: Session):
        """Test model prediction"""
        # Create deployed model
        model = MLModel(
            name="Test Model",
            model_type=ModelType.CLASSIFICATION,
            framework=ModelFramework.SCIKIT_LEARN,
            algorithm="RandomForest",
            owner_id=test_user.id,
            status=ModelStatus.DEPLOYED,
            deployment_url="https://api.example.com/models/1/predict"
        )
        db.add(model)
        db.commit()
        
        prediction_data = {
            "input_data": {"feature1": 1.0, "feature2": 2.0},
            "request_id": "test-request-123"
        }
        
        response = client.post(
            f"/api/v1/ml-models/{model.id}/predict",
            json=prediction_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "prediction" in data
        assert "confidence" in data


class TestPerformanceOptimization:
    """Test performance optimization features"""
    
    def test_caching_functionality(self):
        """Test caching system"""
        # Test cache set and get
        cache_manager.set("test_key", {"data": "test_value"}, ttl=60)
        cached_value = cache_manager.get("test_key")
        
        assert cached_value is not None
        assert cached_value["data"] == "test_value"
        
        # Test cache miss
        cache_manager.delete("test_key")
        cached_value = cache_manager.get("test_key")
        assert cached_value is None
    
    def test_performance_monitoring(self):
        """Test performance monitoring"""
        # Test execution time measurement
        @performance_monitor.measure_execution_time("test_function")
        def test_function():
            time.sleep(0.1)
            return "success"
        
        result = test_function()
        assert result == "success"
        
        # Check if metrics were recorded
        stats = performance_monitor.get_performance_stats("test_function")
        assert "execution_time" in stats
        assert stats["execution_time"]["count"] > 0
    
    def test_database_optimization(self, db: Session):
        """Test database optimization features"""
        from backend.app.core.performance import DatabaseOptimizer
        
        optimizer = DatabaseOptimizer(db)
        
        # Test query optimization
        query = "SELECT * FROM users WHERE email = 'test@example.com'"
        result = optimizer.optimize_query(query)
        
        assert "query" in result
        assert "execution_plan" in result
        assert "recommendations" in result
    
    def test_cache_performance(self):
        """Test cache performance under load"""
        # Test cache performance with multiple operations
        start_time = time.time()
        
        for i in range(100):
            cache_manager.set(f"key_{i}", {"value": i}, ttl=60)
        
        for i in range(100):
            cached_value = cache_manager.get(f"key_{i}")
            assert cached_value["value"] == i
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time
        assert execution_time < 1.0  # Less than 1 second for 200 operations


class TestEnterpriseSecurity:
    """Test enterprise security features"""
    
    def test_permission_checking(self, test_user):
        """Test permission checking system"""
        # Test data scientist permissions
        assert enterprise_security.check_permission(test_user, Permission.DATASET_READ)
        assert enterprise_security.check_permission(test_user, Permission.MODEL_WRITE)
        assert not enterprise_security.check_permission(test_user, Permission.SYSTEM_ADMIN)
        
        # Test admin permissions
        admin_user = User(
            email="admin@example.com",
            username="admin",
            role=UserRole.ADMIN,
            is_active=True
        )
        assert enterprise_security.check_permission(admin_user, Permission.SYSTEM_ADMIN)
        assert enterprise_security.check_permission(admin_user, Permission.USER_ADMIN)
    
    def test_audit_logging(self, test_user):
        """Test audit logging functionality"""
        # Log audit event
        enterprise_security.log_audit_event(
            user_id=test_user.id,
            action="dataset_upload",
            resource="dataset",
            details={"dataset_id": 123, "file_size": "1.2MB"},
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0"
        )
        
        # Retrieve audit log
        audit_log = enterprise_security.get_audit_log(user_id=test_user.id)
        
        assert len(audit_log) == 1
        assert audit_log[0]["action"] == "dataset_upload"
        assert audit_log[0]["resource"] == "dataset"
        assert audit_log[0]["user_id"] == test_user.id
    
    def test_sso_configuration(self):
        """Test SSO provider configuration"""
        # Configure SAML SSO
        saml_config = {
            "entity_id": "test-entity",
            "sso_url": "https://sso.example.com/saml",
            "certificate": "test-cert",
            "acs_url": "https://app.example.com/saml/acs"
        }
        
        enterprise_security.configure_sso_provider(
            SSOProvider.SAML, saml_config
        )
        
        # Verify configuration
        assert SSOProvider.SAML in enterprise_security.sso_providers
    
    def test_role_based_access_control(self, test_user, db: Session):
        """Test RBAC implementation"""
        # Test different user roles
        roles_permissions = {
            UserRole.ADMIN: [Permission.SYSTEM_ADMIN, Permission.USER_ADMIN],
            UserRole.DATA_SCIENTIST: [Permission.MODEL_WRITE, Permission.DATASET_WRITE],
            UserRole.BUSINESS_ANALYST: [Permission.DATASET_READ, Permission.MODEL_READ],
            UserRole.RESEARCHER: [Permission.DATASET_READ, Permission.MODEL_WRITE]
        }
        
        for role, expected_permissions in roles_permissions.items():
            user = User(
                email=f"{role.value}@example.com",
                username=role.value,
                role=role,
                is_active=True
            )
            
            user_permissions = enterprise_security.get_user_permissions(user)
            
            for permission in expected_permissions:
                assert permission in user_permissions


class TestWorkflowAutomation:
    """Test workflow automation features"""
    
    def test_workflow_creation(self, client, auth_headers, test_user, db: Session):
        """Test workflow creation"""
        workflow_data = {
            "name": "Test Workflow",
            "description": "Test automation workflow",
            "workflow_definition": {
                "nodes": [
                    {
                        "id": "input_1",
                        "type": "data_input",
                        "config": {"source_type": "dataset", "source_id": 1}
                    },
                    {
                        "id": "process_1",
                        "type": "data_processing",
                        "config": {"operation": "transform"}
                    }
                ],
                "connections": [
                    {"from": "input_1", "to": "process_1"}
                ]
            }
        }
        
        response = client.post(
            "/api/v1/workflows/",
            json=workflow_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Workflow"
        assert data["status"] == "draft"
    
    def test_workflow_execution(self, test_user, db: Session):
        """Test workflow execution"""
        # Create test workflow
        workflow = Workflow(
            name="Test Workflow",
            workflow_definition={
                "nodes": [
                    {
                        "id": "input_1",
                        "type": "data_input",
                        "config": {"source_type": "dataset", "source_id": 1},
                        "is_start": True
                    }
                ],
                "connections": []
            },
            owner_id=test_user.id,
            status=WorkflowStatus.ACTIVE
        )
        db.add(workflow)
        db.commit()
        db.refresh(workflow)
        
        # Execute workflow
        execution = asyncio.run(workflow_engine.execute_workflow(
            workflow,
            input_data={"test": "data"},
            db=db
        ))
        
        assert execution.status == WorkflowStatus.COMPLETED
        assert execution.execution_time is not None
    
    def test_scheduled_workflow(self, test_user, db: Session):
        """Test scheduled workflow execution"""
        # Create test workflow
        workflow = Workflow(
            name="Scheduled Workflow",
            workflow_definition={
                "nodes": [
                    {
                        "id": "input_1",
                        "type": "data_input",
                        "config": {"source_type": "dataset", "source_id": 1},
                        "is_start": True
                    }
                ],
                "connections": []
            },
            owner_id=test_user.id,
            status=WorkflowStatus.ACTIVE
        )
        db.add(workflow)
        db.commit()
        db.refresh(workflow)
        
        # Schedule workflow
        scheduled_job = workflow_engine.schedule_workflow(
            workflow,
            cron_expression="0 0 * * *",  # Daily at midnight
            db=db
        )
        
        assert scheduled_job.workflow_id == workflow.id
        assert scheduled_job.cron_expression == "0 0 * * *"
        assert scheduled_job.next_execution_at is not None
    
    def test_workflow_node_types(self):
        """Test different workflow node types"""
        # Test data input node
        input_node = workflow_engine.create_node(
            "input_1", NodeType.DATA_INPUT, {"source_type": "dataset", "source_id": 1}
        )
        assert input_node.node_type == NodeType.DATA_INPUT
        
        # Test ML training node
        training_node = workflow_engine.create_node(
            "training_1", NodeType.ML_TRAINING, {"model_type": "classification", "algorithm": "random_forest"}
        )
        assert training_node.node_type == NodeType.ML_TRAINING
        
        # Test condition node
        condition_node = workflow_engine.create_node(
            "condition_1", NodeType.CONDITION, {"condition": "true", "true_path": "node_a", "false_path": "node_b"}
        )
        assert condition_node.node_type == NodeType.CONDITION


class TestLoadTesting:
    """Test load testing capabilities"""
    
    def test_concurrent_model_creation(self, client, auth_headers, test_user, db: Session):
        """Test concurrent model creation"""
        import threading
        import queue
        
        results = queue.Queue()
        
        def create_model(model_id):
            model_data = {
                "name": f"Test Model {model_id}",
                "model_type": "classification",
                "framework": "scikit-learn",
                "algorithm": "RandomForest",
                "target_column": "target",
                "training_dataset_id": 1
            }
            
            response = client.post(
                "/api/v1/ml-models/",
                json=model_data,
                headers=auth_headers
            )
            
            results.put((model_id, response.status_code))
        
        # Create 10 models concurrently
        threads = []
        for i in range(10):
            thread = threading.Thread(target=create_model, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Check results
        success_count = 0
        while not results.empty():
            model_id, status_code = results.get()
            if status_code == 200:
                success_count += 1
        
        # Should have high success rate
        assert success_count >= 8  # At least 80% success rate
    
    def test_cache_performance_under_load(self):
        """Test cache performance under high load"""
        import threading
        import time
        
        def cache_operations(thread_id, num_operations):
            start_time = time.time()
            
            for i in range(num_operations):
                key = f"thread_{thread_id}_key_{i}"
                value = {"thread_id": thread_id, "operation": i}
                
                # Set value
                cache_manager.set(key, value, ttl=60)
                
                # Get value
                cached_value = cache_manager.get(key)
                assert cached_value is not None
                assert cached_value["thread_id"] == thread_id
            
            end_time = time.time()
            return end_time - start_time
        
        # Run cache operations in multiple threads
        threads = []
        results = []
        
        for i in range(5):  # 5 threads
            thread = threading.Thread(
                target=lambda i=i: results.append(cache_operations(i, 100))
            )
            threads.append(thread)
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        # Check performance
        total_time = sum(results)
        avg_time = total_time / len(results)
        
        # Should complete within reasonable time
        assert avg_time < 2.0  # Less than 2 seconds per thread
    
    def test_database_query_performance(self, db: Session):
        """Test database query performance"""
        from backend.app.core.performance import DatabaseOptimizer
        
        optimizer = DatabaseOptimizer(db)
        
        # Test query performance
        start_time = time.time()
        
        for i in range(100):
            query = f"SELECT * FROM users WHERE email = 'test{i}@example.com'"
            result = optimizer.optimize_query(query)
            assert "query" in result
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time
        assert execution_time < 5.0  # Less than 5 seconds for 100 queries


class TestSecurityTesting:
    """Test security features"""
    
    def test_authentication_bypass_attempts(self, client):
        """Test authentication bypass attempts"""
        # Try to access protected endpoint without authentication
        response = client.get("/api/v1/ml-models/")
        assert response.status_code == 401
        
        # Try with invalid token
        response = client.get(
            "/api/v1/ml-models/",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
    
    def test_permission_escalation_attempts(self, client, auth_headers, test_user, db: Session):
        """Test permission escalation attempts"""
        # Create another user
        other_user = User(
            email="other@example.com",
            username="otheruser",
            role=UserRole.BUSINESS_ANALYST,
            is_active=True
        )
        db.add(other_user)
        db.commit()
        
        # Try to access admin-only endpoint with regular user
        response = client.get("/api/v1/admin/users", headers=auth_headers)
        assert response.status_code == 403  # Forbidden
    
    def test_input_validation(self, client, auth_headers):
        """Test input validation and sanitization"""
        # Test with malicious input
        malicious_data = {
            "name": "<script>alert('xss')</script>",
            "model_type": "classification",
            "framework": "scikit-learn",
            "algorithm": "RandomForest",
            "target_column": "target",
            "training_dataset_id": 1
        }
        
        response = client.post(
            "/api/v1/ml-models/",
            json=malicious_data,
            headers=auth_headers
        )
        
        # Should either reject or sanitize the input
        if response.status_code == 200:
            data = response.json()
            assert "<script>" not in data["name"]
    
    def test_sql_injection_attempts(self, client, auth_headers):
        """Test SQL injection prevention"""
        # Try SQL injection in query parameters
        response = client.get(
            "/api/v1/ml-models/?name='; DROP TABLE users; --",
            headers=auth_headers
        )
        
        # Should not cause database error
        assert response.status_code in [200, 400]  # Either success or bad request, not 500


# Integration tests
class TestPhase4Integration:
    """Integration tests for Phase 4 features"""
    
    def test_end_to_end_ml_pipeline(self, client, auth_headers, test_user, db: Session):
        """Test complete ML pipeline from data to deployment"""
        # 1. Create and train model
        model_data = {
            "name": "Integration Test Model",
            "model_type": "classification",
            "framework": "scikit-learn",
            "algorithm": "RandomForest",
            "target_column": "target",
            "training_dataset_id": 1
        }
        
        response = client.post(
            "/api/v1/ml-models/",
            json=model_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        model_id = response.json()["id"]
        
        # 2. Train model
        training_config = {"hyperparameters": {"n_estimators": 100}}
        response = client.post(
            f"/api/v1/ml-models/{model_id}/train",
            json=training_config,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # 3. Deploy model
        deployment_config = {
            "deployment_name": "integration-test-deployment",
            "deployment_type": "api"
        }
        response = client.post(
            f"/api/v1/ml-models/{model_id}/deploy",
            json=deployment_config,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # 4. Make prediction
        prediction_data = {
            "input_data": {"feature1": 1.0, "feature2": 2.0}
        }
        response = client.post(
            f"/api/v1/ml-models/{model_id}/predict",
            json=prediction_data,
            headers=auth_headers
        )
        assert response.status_code == 200
    
    def test_workflow_with_ml_models(self, test_user, db: Session):
        """Test workflow that includes ML model operations"""
        # Create workflow with ML training node
        workflow = Workflow(
            name="ML Training Workflow",
            workflow_definition={
                "nodes": [
                    {
                        "id": "input_1",
                        "type": "data_input",
                        "config": {"source_type": "dataset", "source_id": 1},
                        "is_start": True
                    },
                    {
                        "id": "training_1",
                        "type": "ml_training",
                        "config": {
                            "model_type": "classification",
                            "algorithm": "random_forest",
                            "target_column": "target"
                        }
                    }
                ],
                "connections": [
                    {"from": "input_1", "to": "training_1"}
                ]
            },
            owner_id=test_user.id,
            status=WorkflowStatus.ACTIVE
        )
        db.add(workflow)
        db.commit()
        db.refresh(workflow)
        
        # Execute workflow
        execution = asyncio.run(workflow_engine.execute_workflow(
            workflow,
            input_data={"dataset_id": 1},
            db=db
        ))
        
        assert execution.status == WorkflowStatus.COMPLETED
        assert execution.completed_nodes is not None
        assert "training_1" in execution.completed_nodes


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
