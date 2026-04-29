"""
AutoML endpoints for the ML Engine service
"""

from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
import structlog
import pandas as pd
import numpy as np
from datetime import datetime
import uuid

from app.ml.automl import automl_engine
from app.core.cache import cache_manager

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post("/run")
async def run_automl(
    dataset_id: str,
    target_column: str,
    problem_type: str,
    max_training_time: int = 3600,
    cv_folds: int = 5,
    optimization_metric: str = "auto",
    feature_engineering: bool = True,
    hyperparameter_tuning: bool = True,
    algorithms: Optional[List[str]] = None
):
    """Run AutoML pipeline on a dataset"""
    try:
        logger.info("Starting AutoML pipeline", 
                   dataset_id=dataset_id,
                   target_column=target_column,
                   problem_type=problem_type)
        
        # TODO: Load dataset from storage or database
        # This is a placeholder - in real implementation, load from dataset_id
        X, y = _load_dataset_placeholder(dataset_id, target_column)
        
        # Validate problem type
        if problem_type not in ['classification', 'regression']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Problem type must be 'classification' or 'regression'"
            )
        
        # Filter algorithms if specified
        if algorithms:
            if problem_type == 'classification':
                automl_engine.classification_models = {
                    name: model for name, model in automl_engine.classification_models.items() 
                    if name in algorithms
                }
            else:
                automl_engine.regression_models = {
                    name: model for name, model in automl_engine.regression_models.items() 
                    if name in algorithms
                }
        
        # Run AutoML
        result = automl_engine.run_automl(
            X=X,
            y=y,
            problem_type=problem_type,
            max_training_time=max_training_time,
            cv_folds=cv_folds,
            optimization_metric=optimization_metric,
            feature_engineering=feature_engineering,
            hyperparameter_tuning=hyperparameter_tuning
        )
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Cache results
        cache_manager.set(f"automl_result_{job_id}", result, expire=3600)
        
        # Prepare response
        response = {
            "job_id": job_id,
            "status": "completed",
            "best_model": {
                "name": result['best_model']['model_name'],
                "cv_score": result['best_model']['cv_score'],
                "cv_std": result['best_model']['cv_std'],
                "best_params": result['best_model']['best_params'],
                "additional_metrics": result['best_model']['additional_metrics']
            },
            "all_models": [
                {
                    "name": model['model_name'],
                    "cv_score": model['cv_score'],
                    "cv_std": model['cv_std'],
                    "training_time": model['training_time']
                }
                for model in result['all_models']
            ],
            "feature_importance": result['feature_importance'],
            "recommendations": result['recommendations'],
            "total_training_time": result['total_training_time'],
            "optimization_metric": result['optimization_metric'],
            "cv_folds": result['cv_folds'],
            "completed_at": datetime.utcnow().isoformat()
        }
        
        logger.info("AutoML pipeline completed successfully", 
                   job_id=job_id,
                   best_model=result['best_model']['model_name'],
                   best_score=result['best_model']['cv_score'])
        
        return response
        
    except Exception as e:
        logger.error("AutoML pipeline failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AutoML pipeline failed: {str(e)}"
        )


@router.get("/results/{job_id}")
async def get_automl_results(job_id: str):
    """Get AutoML results by job ID"""
    try:
        # Get results from cache
        result = cache_manager.get(f"automl_result_{job_id}")
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="AutoML results not found or expired"
            )
        
        # Prepare response
        response = {
            "job_id": job_id,
            "status": "completed",
            "best_model": {
                "name": result['best_model']['model_name'],
                "cv_score": result['best_model']['cv_score'],
                "cv_std": result['best_model']['cv_std'],
                "best_params": result['best_model']['best_params'],
                "additional_metrics": result['best_model']['additional_metrics']
            },
            "all_models": [
                {
                    "name": model['model_name'],
                    "cv_score": model['cv_score'],
                    "cv_std": model['cv_std'],
                    "training_time": model['training_time']
                }
                for model in result['all_models']
            ],
            "feature_importance": result['feature_importance'],
            "recommendations": result['recommendations'],
            "total_training_time": result['total_training_time'],
            "optimization_metric": result['optimization_metric'],
            "cv_folds": result['cv_folds']
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get AutoML results", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve AutoML results"
        )


@router.post("/compare-models")
async def compare_models(
    dataset_id: str,
    target_column: str,
    problem_type: str,
    model_configs: List[Dict[str, Any]],
    cv_folds: int = 5
):
    """Compare multiple model configurations"""
    try:
        logger.info("Starting model comparison", 
                   dataset_id=dataset_id,
                   model_count=len(model_configs))
        
        # Load dataset
        X, y = _load_dataset_placeholder(dataset_id, target_column)
        
        # Preprocess data
        X_processed, y_processed, _ = automl_engine._preprocess_data(X, y, problem_type)
        
        comparison_results = []
        
        for config in model_configs:
            model_name = config.get('model_name')
            model_params = config.get('params', {})
            
            if not model_name:
                continue
            
            try:
                # Get model
                if problem_type == 'classification':
                    if model_name not in automl_engine.classification_models:
                        continue
                    model = automl_engine.classification_models[model_name]
                else:
                    if model_name not in automl_engine.regression_models:
                        continue
                    model = automl_engine.regression_models[model_name]
                
                # Set parameters
                model.set_params(**model_params)
                
                # Cross-validation
                from sklearn.model_selection import cross_val_score
                optimization_metric = 'accuracy' if problem_type == 'classification' else 'neg_mean_squared_error'
                cv_scores = cross_val_score(model, X_processed, y_processed, cv=cv_folds, scoring=optimization_metric)
                
                # Train and get predictions
                model.fit(X_processed, y_processed)
                y_pred = model.predict(X_processed)
                
                # Calculate metrics
                additional_metrics = automl_engine._calculate_additional_metrics(y_processed, y_pred, problem_type)
                
                result = {
                    "model_name": model_name,
                    "params": model_params,
                    "cv_score": cv_scores.mean(),
                    "cv_std": cv_scores.std(),
                    "additional_metrics": additional_metrics
                }
                
                comparison_results.append(result)
                
            except Exception as e:
                logger.warning("Failed to evaluate model", model_name=model_name, error=str(e))
                continue
        
        # Sort by CV score
        comparison_results.sort(key=lambda x: x['cv_score'], reverse=True)
        
        # Generate comparison summary
        best_model = comparison_results[0] if comparison_results else None
        comparison_id = str(uuid.uuid4())
        
        response = {
            "comparison_id": comparison_id,
            "best_model": best_model,
            "all_results": comparison_results,
            "summary": {
                "total_models": len(comparison_results),
                "best_score": best_model['cv_score'] if best_model else None,
                "score_range": {
                    "min": min(r['cv_score'] for r in comparison_results) if comparison_results else None,
                    "max": max(r['cv_score'] for r in comparison_results) if comparison_results else None
                }
            },
            "recommendations": _generate_comparison_recommendations(comparison_results),
            "completed_at": datetime.utcnow().isoformat()
        }
        
        logger.info("Model comparison completed", 
                   comparison_id=comparison_id,
                   best_model=best_model['model_name'] if best_model else None)
        
        return response
        
    except Exception as e:
        logger.error("Model comparison failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model comparison failed: {str(e)}"
        )


@router.get("/available-algorithms")
async def get_available_algorithms():
    """Get list of available algorithms for AutoML"""
    try:
        algorithms = {
            "classification": list(automl_engine.classification_models.keys()),
            "regression": list(automl_engine.regression_models.keys())
        }
        
        return {
            "algorithms": algorithms,
            "hyperparameter_grids": {
                name: list(params.keys()) 
                for name, params in automl_engine.hyperparameter_grids.items()
            },
            "feature_engineering_methods": automl_engine.feature_engineering_methods
        }
        
    except Exception as e:
        logger.error("Failed to get available algorithms", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve available algorithms"
        )


@router.post("/hyperparameter-tuning")
async def tune_hyperparameters(
    dataset_id: str,
    target_column: str,
    model_name: str,
    problem_type: str,
    param_grid: Dict[str, List[Any]],
    cv_folds: int = 5,
    optimization_metric: str = "auto"
):
    """Tune hyperparameters for a specific model"""
    try:
        logger.info("Starting hyperparameter tuning", 
                   dataset_id=dataset_id,
                   model_name=model_name)
        
        # Load dataset
        X, y = _load_dataset_placeholder(dataset_id, target_column)
        
        # Preprocess data
        X_processed, y_processed, _ = automl_engine._preprocess_data(X, y, problem_type)
        
        # Get model
        if problem_type == 'classification':
            if model_name not in automl_engine.classification_models:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Model {model_name} not available for classification"
                )
            model = automl_engine.classification_models[model_name]
        else:
            if model_name not in automl_engine.regression_models:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Model {model_name} not available for regression"
                )
            model = automl_engine.regression_models[model_name]
        
        # Set optimization metric
        if optimization_metric == "auto":
            optimization_metric = 'accuracy' if problem_type == 'classification' else 'neg_mean_squared_error'
        
        # Grid search
        from sklearn.model_selection import GridSearchCV
        grid_search = GridSearchCV(
            model, 
            param_grid, 
            cv=cv_folds, 
            scoring=optimization_metric, 
            n_jobs=-1,
            verbose=0
        )
        
        grid_search.fit(X_processed, y_processed)
        
        # Get results
        results = {
            "model_name": model_name,
            "best_params": grid_search.best_params_,
            "best_score": grid_search.best_score_,
            "cv_results": {
                "mean_test_score": grid_search.cv_results_['mean_test_score'].tolist(),
                "std_test_score": grid_search.cv_results_['std_test_score'].tolist(),
                "params": grid_search.cv_results_['params']
            },
            "optimization_metric": optimization_metric,
            "cv_folds": cv_folds
        }
        
        logger.info("Hyperparameter tuning completed", 
                   model_name=model_name,
                   best_score=grid_search.best_score_)
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Hyperparameter tuning failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hyperparameter tuning failed: {str(e)}"
        )


def _load_dataset_placeholder(dataset_id: str, target_column: str) -> tuple:
    """Placeholder function to load dataset - replace with actual implementation"""
    # This is a placeholder - in real implementation, load from storage/database
    np.random.seed(42)
    n_samples = 1000
    n_features = 10
    
    # Generate synthetic data
    X = pd.DataFrame(
        np.random.randn(n_samples, n_features),
        columns=[f'feature_{i}' for i in range(n_features)]
    )
    
    # Add some categorical features
    X['category'] = np.random.choice(['A', 'B', 'C'], n_samples)
    X['binary'] = np.random.choice([0, 1], n_samples)
    
    # Generate target variable
    if target_column == 'classification_target':
        y = np.random.choice([0, 1], n_samples)
    else:
        y = np.random.randn(n_samples)
    
    return X, pd.Series(y, name=target_column)


def _generate_comparison_recommendations(results: List[Dict]) -> List[str]:
    """Generate recommendations based on model comparison results"""
    recommendations = []
    
    if not results:
        return ["No models were successfully evaluated."]
    
    # Best model recommendation
    best_model = results[0]
    recommendations.append(f"Best performing model: {best_model['model_name']} with score: {best_model['cv_score']:.4f}")
    
    # Performance analysis
    scores = [r['cv_score'] for r in results]
    score_std = np.std(scores)
    
    if score_std < 0.01:
        recommendations.append("All models performed similarly. Consider ensemble methods.")
    else:
        recommendations.append(f"Performance varies significantly (std: {score_std:.4f}). Best model is clearly superior.")
    
    # Top 3 models
    top_3 = results[:3]
    recommendations.append(f"Top 3 models: {', '.join([r['model_name'] for r in top_3])}")
    
    return recommendations
