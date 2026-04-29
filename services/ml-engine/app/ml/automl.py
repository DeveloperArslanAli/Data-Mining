"""
AutoML Engine for automated machine learning
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple, Union
from sklearn.model_selection import cross_val_score, train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_selection import SelectKBest, f_classif, f_regression
import xgboost as xgb
import lightgbm as lgb
import structlog
import time
import json
from datetime import datetime

logger = structlog.get_logger(__name__)


class AutoMLEngine:
    """Automated Machine Learning Engine"""
    
    def __init__(self):
        self.classification_models = {
            'random_forest': RandomForestClassifier(random_state=42),
            'gradient_boosting': GradientBoostingClassifier(random_state=42),
            'logistic_regression': LogisticRegression(random_state=42, max_iter=1000),
            'svm': SVC(random_state=42),
            'knn': KNeighborsClassifier(),
            'naive_bayes': GaussianNB(),
            'decision_tree': DecisionTreeClassifier(random_state=42),
            'xgboost': xgb.XGBClassifier(random_state=42, eval_metric='logloss'),
            'lightgbm': lgb.LGBMClassifier(random_state=42, verbose=-1)
        }
        
        self.regression_models = {
            'random_forest': RandomForestRegressor(random_state=42),
            'gradient_boosting': GradientBoostingRegressor(random_state=42),
            'linear_regression': LinearRegression(),
            'ridge': Ridge(random_state=42),
            'lasso': Lasso(random_state=42),
            'svr': SVR(),
            'knn': KNeighborsRegressor(),
            'decision_tree': DecisionTreeRegressor(random_state=42),
            'xgboost': xgb.XGBRegressor(random_state=42),
            'lightgbm': lgb.LGBMRegressor(random_state=42, verbose=-1)
        }
        
        self.hyperparameter_grids = self._get_hyperparameter_grids()
        self.feature_engineering_methods = [
            'polynomial_features',
            'interaction_features',
            'binning',
            'scaling',
            'encoding'
        ]
    
    def _get_hyperparameter_grids(self) -> Dict[str, Dict[str, List]]:
        """Get hyperparameter grids for different algorithms"""
        return {
            'random_forest': {
                'n_estimators': [50, 100, 200],
                'max_depth': [None, 10, 20, 30],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            },
            'gradient_boosting': {
                'n_estimators': [50, 100, 200],
                'learning_rate': [0.01, 0.1, 0.2],
                'max_depth': [3, 5, 7],
                'subsample': [0.8, 0.9, 1.0]
            },
            'logistic_regression': {
                'C': [0.1, 1, 10, 100],
                'penalty': ['l1', 'l2'],
                'solver': ['liblinear', 'saga']
            },
            'svm': {
                'C': [0.1, 1, 10, 100],
                'kernel': ['linear', 'rbf', 'poly'],
                'gamma': ['scale', 'auto', 0.001, 0.01, 0.1]
            },
            'knn': {
                'n_neighbors': [3, 5, 7, 9, 11],
                'weights': ['uniform', 'distance'],
                'metric': ['euclidean', 'manhattan']
            },
            'xgboost': {
                'n_estimators': [50, 100, 200],
                'learning_rate': [0.01, 0.1, 0.2],
                'max_depth': [3, 5, 7],
                'subsample': [0.8, 0.9, 1.0]
            },
            'lightgbm': {
                'n_estimators': [50, 100, 200],
                'learning_rate': [0.01, 0.1, 0.2],
                'max_depth': [3, 5, 7],
                'subsample': [0.8, 0.9, 1.0]
            }
        }
    
    def run_automl(self, 
                   X: pd.DataFrame, 
                   y: pd.Series, 
                   problem_type: str,
                   max_training_time: int = 3600,
                   cv_folds: int = 5,
                   optimization_metric: str = 'auto',
                   feature_engineering: bool = True,
                   hyperparameter_tuning: bool = True) -> Dict[str, Any]:
        """Run AutoML pipeline"""
        start_time = time.time()
        
        try:
            logger.info("Starting AutoML pipeline", 
                       problem_type=problem_type,
                       max_training_time=max_training_time,
                       cv_folds=cv_folds)
            
            # Data preprocessing
            X_processed, y_processed, preprocessing_info = self._preprocess_data(X, y, problem_type)
            
            # Feature engineering
            if feature_engineering:
                X_processed, feature_engineering_info = self._engineer_features(X_processed, y_processed, problem_type)
            else:
                feature_engineering_info = {}
            
            # Model selection and training
            if problem_type == 'classification':
                models = self.classification_models
                optimization_metric = optimization_metric or 'accuracy'
            else:
                models = self.regression_models
                optimization_metric = optimization_metric or 'neg_mean_squared_error'
            
            # Train and evaluate models
            model_results = []
            best_model = None
            best_score = -np.inf
            
            for model_name, model in models.items():
                if time.time() - start_time > max_training_time:
                    logger.warning("Training time limit reached", elapsed_time=time.time() - start_time)
                    break
                
                try:
                    logger.info("Training model", model_name=model_name)
                    
                    # Hyperparameter tuning
                    if hyperparameter_tuning and model_name in self.hyperparameter_grids:
                        model, best_params = self._tune_hyperparameters(
                            model, model_name, X_processed, y_processed, cv_folds, optimization_metric
                        )
                    else:
                        best_params = {}
                    
                    # Cross-validation
                    cv_scores = cross_val_score(model, X_processed, y_processed, cv=cv_folds, scoring=optimization_metric)
                    mean_score = cv_scores.mean()
                    std_score = cv_scores.std()
                    
                    # Train on full dataset
                    model.fit(X_processed, y_processed)
                    
                    # Calculate additional metrics
                    y_pred = model.predict(X_processed)
                    additional_metrics = self._calculate_additional_metrics(y_processed, y_pred, problem_type)
                    
                    model_result = {
                        'model_name': model_name,
                        'model': model,
                        'cv_score': mean_score,
                        'cv_std': std_score,
                        'best_params': best_params,
                        'additional_metrics': additional_metrics,
                        'training_time': time.time() - start_time
                    }
                    
                    model_results.append(model_result)
                    
                    # Update best model
                    if mean_score > best_score:
                        best_score = mean_score
                        best_model = model_result
                    
                    logger.info("Model training completed", 
                               model_name=model_name,
                               cv_score=mean_score,
                               cv_std=std_score)
                    
                except Exception as e:
                    logger.error("Failed to train model", model_name=model_name, error=str(e))
                    continue
            
            # Feature importance
            feature_importance = self._get_feature_importance(best_model['model'], X_processed.columns)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(model_results, best_model, problem_type)
            
            total_time = time.time() - start_time
            
            result = {
                'best_model': best_model,
                'all_models': model_results,
                'feature_importance': feature_importance,
                'preprocessing_info': preprocessing_info,
                'feature_engineering_info': feature_engineering_info,
                'recommendations': recommendations,
                'total_training_time': total_time,
                'optimization_metric': optimization_metric,
                'cv_folds': cv_folds
            }
            
            logger.info("AutoML pipeline completed", 
                       total_time=total_time,
                       best_model=best_model['model_name'],
                       best_score=best_score)
            
            return result
            
        except Exception as e:
            logger.error("AutoML pipeline failed", error=str(e))
            raise
    
    def _preprocess_data(self, X: pd.DataFrame, y: pd.Series, problem_type: str) -> Tuple[pd.DataFrame, pd.Series, Dict[str, Any]]:
        """Preprocess data for ML"""
        preprocessing_info = {}
        
        # Handle missing values
        missing_before = X.isnull().sum().sum()
        X_processed = X.copy()
        
        # Fill missing values
        for col in X_processed.columns:
            if X_processed[col].dtype in ['object', 'category']:
                X_processed[col] = X_processed[col].fillna(X_processed[col].mode()[0] if not X_processed[col].mode().empty else 'Unknown')
            else:
                X_processed[col] = X_processed[col].fillna(X_processed[col].median())
        
        missing_after = X_processed.isnull().sum().sum()
        preprocessing_info['missing_values_filled'] = missing_before - missing_after
        
        # Encode categorical variables
        categorical_columns = X_processed.select_dtypes(include=['object', 'category']).columns
        encoders = {}
        
        for col in categorical_columns:
            encoder = LabelEncoder()
            X_processed[col] = encoder.fit_transform(X_processed[col].astype(str))
            encoders[col] = encoder
        
        preprocessing_info['categorical_columns_encoded'] = list(categorical_columns)
        preprocessing_info['encoders'] = encoders
        
        # Handle target variable
        y_processed = y.copy()
        if problem_type == 'classification' and y_processed.dtype == 'object':
            target_encoder = LabelEncoder()
            y_processed = target_encoder.fit_transform(y_processed)
            preprocessing_info['target_encoder'] = target_encoder
        
        return X_processed, y_processed, preprocessing_info
    
    def _engineer_features(self, X: pd.DataFrame, y: pd.Series, problem_type: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Engineer features for better model performance"""
        feature_engineering_info = {}
        X_engineered = X.copy()
        
        # Feature selection
        if len(X_engineered.columns) > 10:
            if problem_type == 'classification':
                selector = SelectKBest(score_func=f_classif, k=min(10, len(X_engineered.columns)))
            else:
                selector = SelectKBest(score_func=f_regression, k=min(10, len(X_engineered.columns)))
            
            X_engineered = pd.DataFrame(
                selector.fit_transform(X_engineered, y),
                columns=X_engineered.columns[selector.get_support()],
                index=X_engineered.index
            )
            
            feature_engineering_info['feature_selection'] = {
                'selected_features': list(X_engineered.columns),
                'feature_scores': dict(zip(X_engineered.columns, selector.scores_))
            }
        
        # Polynomial features for numerical columns
        numerical_columns = X_engineered.select_dtypes(include=[np.number]).columns
        if len(numerical_columns) > 0:
            # Add squared features for top numerical features
            top_numerical = numerical_columns[:3]  # Top 3 numerical features
            for col in top_numerical:
                X_engineered[f'{col}_squared'] = X_engineered[col] ** 2
                X_engineered[f'{col}_sqrt'] = np.sqrt(np.abs(X_engineered[col]))
            
            feature_engineering_info['polynomial_features'] = {
                'squared_features': [f'{col}_squared' for col in top_numerical],
                'sqrt_features': [f'{col}_sqrt' for col in top_numerical]
            }
        
        # Interaction features
        if len(numerical_columns) >= 2:
            # Add interaction between top 2 numerical features
            top_two = numerical_columns[:2]
            X_engineered[f'{top_two[0]}_x_{top_two[1]}'] = X_engineered[top_two[0]] * X_engineered[top_two[1]]
            
            feature_engineering_info['interaction_features'] = [f'{top_two[0]}_x_{top_two[1]}']
        
        return X_engineered, feature_engineering_info
    
    def _tune_hyperparameters(self, model, model_name: str, X: pd.DataFrame, y: pd.Series, cv_folds: int, scoring: str) -> Tuple[Any, Dict[str, Any]]:
        """Tune hyperparameters for a model"""
        if model_name not in self.hyperparameter_grids:
            return model, {}
        
        param_grid = self.hyperparameter_grids[model_name]
        
        # Limit grid search for time efficiency
        limited_param_grid = {}
        for param, values in param_grid.items():
            limited_param_grid[param] = values[:3]  # Limit to 3 values per parameter
        
        grid_search = GridSearchCV(
            model, 
            limited_param_grid, 
            cv=cv_folds, 
            scoring=scoring, 
            n_jobs=-1,
            verbose=0
        )
        
        grid_search.fit(X, y)
        
        return grid_search.best_estimator_, grid_search.best_params_
    
    def _calculate_additional_metrics(self, y_true: pd.Series, y_pred: np.ndarray, problem_type: str) -> Dict[str, float]:
        """Calculate additional metrics for model evaluation"""
        metrics = {}
        
        if problem_type == 'classification':
            metrics['accuracy'] = accuracy_score(y_true, y_pred)
            metrics['precision'] = precision_score(y_true, y_pred, average='weighted', zero_division=0)
            metrics['recall'] = recall_score(y_true, y_pred, average='weighted', zero_division=0)
            metrics['f1_score'] = f1_score(y_true, y_pred, average='weighted', zero_division=0)
        else:
            metrics['mse'] = mean_squared_error(y_true, y_pred)
            metrics['rmse'] = np.sqrt(metrics['mse'])
            metrics['mae'] = mean_absolute_error(y_true, y_pred)
            metrics['r2_score'] = r2_score(y_true, y_pred)
        
        return metrics
    
    def _get_feature_importance(self, model, feature_names: List[str]) -> Dict[str, float]:
        """Get feature importance from the best model"""
        try:
            if hasattr(model, 'feature_importances_'):
                importance_dict = dict(zip(feature_names, model.feature_importances_))
                # Sort by importance
                return dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))
            elif hasattr(model, 'coef_'):
                # For linear models
                if len(model.coef_.shape) == 1:
                    importance_dict = dict(zip(feature_names, np.abs(model.coef_)))
                else:
                    # Multi-class case
                    importance_dict = dict(zip(feature_names, np.abs(model.coef_).mean(axis=0)))
                return dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))
            else:
                return {}
        except Exception as e:
            logger.warning("Could not extract feature importance", error=str(e))
            return {}
    
    def _generate_recommendations(self, model_results: List[Dict], best_model: Dict, problem_type: str) -> List[str]:
        """Generate recommendations based on AutoML results"""
        recommendations = []
        
        if not model_results:
            return ["No models were successfully trained. Check your data quality and preprocessing."]
        
        # Best model recommendation
        recommendations.append(f"Best performing model: {best_model['model_name']} with CV score: {best_model['cv_score']:.4f}")
        
        # Model comparison
        if len(model_results) > 1:
            scores = [result['cv_score'] for result in model_results]
            score_std = np.std(scores)
            if score_std < 0.01:
                recommendations.append("All models performed similarly. Consider ensemble methods.")
            else:
                second_best = sorted(model_results, key=lambda x: x['cv_score'], reverse=True)[1]
                recommendations.append(f"Second best model: {second_best['model_name']} (score: {second_best['cv_score']:.4f})")
        
        # Performance recommendations
        if problem_type == 'classification':
            if best_model['cv_score'] < 0.7:
                recommendations.append("Model performance is below 70%. Consider feature engineering or more data.")
            elif best_model['cv_score'] > 0.95:
                recommendations.append("Excellent model performance! Consider checking for data leakage.")
        else:
            if best_model['cv_score'] < -0.5:  # For negative MSE
                recommendations.append("Model performance could be improved. Consider feature engineering.")
            elif best_model['cv_score'] > -0.1:
                recommendations.append("Excellent model performance! Consider checking for overfitting.")
        
        # Feature importance recommendations
        if best_model.get('additional_metrics', {}).get('feature_importance'):
            top_features = list(best_model['additional_metrics']['feature_importance'].keys())[:3]
            recommendations.append(f"Most important features: {', '.join(top_features)}")
        
        # Hyperparameter recommendations
        if best_model.get('best_params'):
            recommendations.append("Consider fine-tuning hyperparameters further for better performance.")
        
        return recommendations


# Global AutoML engine instance
automl_engine = AutoMLEngine()
