"""
Performance optimization utilities and caching mechanisms
"""

import time
import functools
import asyncio
from typing import Any, Callable, Dict, List, Optional, Union
from sqlalchemy.orm import Session
from sqlalchemy import text
import structlog
import redis
from redis import Redis
import json
import hashlib
import pickle
from datetime import datetime, timedelta

from app.core.config import settings

logger = structlog.get_logger(__name__)


class PerformanceMonitor:
    """Performance monitoring and optimization utilities"""
    
    def __init__(self):
        self.redis_client = None
        self._init_redis()
        self.metrics = {}
    
    def _init_redis(self):
        """Initialize Redis connection for caching"""
        try:
            if hasattr(settings, 'REDIS_URL') and settings.REDIS_URL:
                self.redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
                # Test connection
                self.redis_client.ping()
                logger.info("Redis connection established for performance optimization")
            else:
                logger.warning("Redis not configured, using in-memory caching")
        except Exception as e:
            logger.error("Failed to connect to Redis", error=str(e))
            self.redis_client = None
    
    def cache_result(self, key: str, value: Any, expire: int = 3600) -> bool:
        """Cache a result with expiration"""
        try:
            if self.redis_client:
                # Serialize value
                serialized_value = json.dumps(value, default=str)
                return self.redis_client.setex(key, expire, serialized_value)
            else:
                # In-memory caching (simple implementation)
                if not hasattr(self, '_memory_cache'):
                    self._memory_cache = {}
                self._memory_cache[key] = {
                    'value': value,
                    'expires': time.time() + expire
                }
                return True
        except Exception as e:
            logger.error("Failed to cache result", key=key, error=str(e))
            return False
    
    def get_cached_result(self, key: str) -> Optional[Any]:
        """Get cached result"""
        try:
            if self.redis_client:
                cached = self.redis_client.get(key)
                if cached:
                    return json.loads(cached)
            else:
                # In-memory cache lookup
                if hasattr(self, '_memory_cache') and key in self._memory_cache:
                    cache_entry = self._memory_cache[key]
                    if time.time() < cache_entry['expires']:
                        return cache_entry['value']
                    else:
                        del self._memory_cache[key]
            return None
        except Exception as e:
            logger.error("Failed to get cached result", key=key, error=str(e))
            return None
    
    def invalidate_cache(self, pattern: str) -> int:
        """Invalidate cache entries matching pattern"""
        try:
            if self.redis_client:
                keys = self.redis_client.keys(pattern)
                if keys:
                    return self.redis_client.delete(*keys)
            else:
                # In-memory cache invalidation
                if hasattr(self, '_memory_cache'):
                    keys_to_delete = [k for k in self._memory_cache.keys() if pattern.replace('*', '') in k]
                    for key in keys_to_delete:
                        del self._memory_cache[key]
                    return len(keys_to_delete)
            return 0
        except Exception as e:
            logger.error("Failed to invalidate cache", pattern=pattern, error=str(e))
            return 0
    
    def measure_execution_time(self, func_name: str):
        """Decorator to measure function execution time"""
        def decorator(func: Callable) -> Callable:
            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    execution_time = time.time() - start_time
                    self._record_metric(func_name, 'execution_time', execution_time)
                    logger.info("Function executed", 
                               function=func_name, 
                               execution_time=execution_time)
                    return result
                except Exception as e:
                    execution_time = time.time() - start_time
                    self._record_metric(func_name, 'error_time', execution_time)
                    logger.error("Function failed", 
                                function=func_name, 
                                execution_time=execution_time,
                                error=str(e))
                    raise
            
            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    execution_time = time.time() - start_time
                    self._record_metric(func_name, 'execution_time', execution_time)
                    logger.info("Function executed", 
                               function=func_name, 
                               execution_time=execution_time)
                    return result
                except Exception as e:
                    execution_time = time.time() - start_time
                    self._record_metric(func_name, 'error_time', execution_time)
                    logger.error("Function failed", 
                                function=func_name, 
                                execution_time=execution_time,
                                error=str(e))
                    raise
            
            if asyncio.iscoroutinefunction(func):
                return async_wrapper
            else:
                return sync_wrapper
        
        return decorator
    
    def _record_metric(self, func_name: str, metric_type: str, value: float):
        """Record performance metric"""
        if func_name not in self.metrics:
            self.metrics[func_name] = {}
        
        if metric_type not in self.metrics[func_name]:
            self.metrics[func_name][metric_type] = []
        
        self.metrics[func_name][metric_type].append({
            'value': value,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Keep only last 100 measurements
        if len(self.metrics[func_name][metric_type]) > 100:
            self.metrics[func_name][metric_type] = self.metrics[func_name][metric_type][-100:]
    
    def get_performance_stats(self, func_name: Optional[str] = None) -> Dict[str, Any]:
        """Get performance statistics"""
        if func_name:
            if func_name in self.metrics:
                return self._calculate_stats(self.metrics[func_name])
            else:
                return {}
        else:
            return {
                name: self._calculate_stats(metrics) 
                for name, metrics in self.metrics.items()
            }
    
    def _calculate_stats(self, metrics: Dict[str, List]) -> Dict[str, Any]:
        """Calculate statistics for metrics"""
        stats = {}
        
        for metric_type, values in metrics.items():
            if values:
                metric_values = [v['value'] for v in values]
                stats[metric_type] = {
                    'count': len(metric_values),
                    'min': min(metric_values),
                    'max': max(metric_values),
                    'avg': sum(metric_values) / len(metric_values),
                    'latest': metric_values[-1] if metric_values else 0
                }
        
        return stats


class DatabaseOptimizer:
    """Database query optimization utilities"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def optimize_query(self, query: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Analyze and optimize database query"""
        try:
            # Get query execution plan
            explain_query = f"EXPLAIN ANALYZE {query}"
            result = self.db.execute(text(explain_query), params or {})
            
            execution_plan = []
            for row in result:
                execution_plan.append(dict(row))
            
            # Analyze execution plan
            analysis = self._analyze_execution_plan(execution_plan)
            
            return {
                'query': query,
                'execution_plan': execution_plan,
                'analysis': analysis,
                'recommendations': self._generate_optimization_recommendations(analysis)
            }
            
        except Exception as e:
            logger.error("Failed to optimize query", query=query, error=str(e))
            return {'error': str(e)}
    
    def _analyze_execution_plan(self, plan: List[Dict]) -> Dict[str, Any]:
        """Analyze query execution plan"""
        analysis = {
            'total_cost': 0,
            'execution_time': 0,
            'operations': [],
            'index_usage': [],
            'table_scans': [],
            'joins': []
        }
        
        for step in plan:
            if 'Total Cost' in step:
                analysis['total_cost'] = float(step['Total Cost'])
            if 'Actual Total Time' in step:
                analysis['execution_time'] = float(step['Actual Total Time'])
            
            operation = step.get('Node Type', 'Unknown')
            analysis['operations'].append(operation)
            
            if 'Index' in step:
                analysis['index_usage'].append(step['Index'])
            
            if 'Seq Scan' in operation:
                analysis['table_scans'].append(step.get('Relation Name', 'Unknown'))
            
            if 'Join' in operation:
                analysis['joins'].append({
                    'type': operation,
                    'relation': step.get('Relation Name', 'Unknown')
                })
        
        return analysis
    
    def _generate_optimization_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate optimization recommendations based on analysis"""
        recommendations = []
        
        # Check for sequential scans
        if analysis['table_scans']:
            recommendations.append(f"Consider adding indexes for tables: {', '.join(analysis['table_scans'])}")
        
        # Check for expensive operations
        if analysis['total_cost'] > 1000:
            recommendations.append("Query has high cost. Consider optimizing joins and adding indexes.")
        
        # Check for missing indexes
        if not analysis['index_usage'] and analysis['table_scans']:
            recommendations.append("No indexes used. Consider adding appropriate indexes.")
        
        # Check execution time
        if analysis['execution_time'] > 1000:  # 1 second
            recommendations.append("Query execution time is high. Consider optimization.")
        
        return recommendations
    
    def create_index(self, table: str, columns: List[str], index_name: Optional[str] = None) -> bool:
        """Create database index"""
        try:
            if not index_name:
                index_name = f"idx_{table}_{'_'.join(columns)}"
            
            columns_str = ', '.join(columns)
            create_index_query = f"CREATE INDEX IF NOT EXISTS {index_name} ON {table} ({columns_str})"
            
            self.db.execute(text(create_index_query))
            self.db.commit()
            
            logger.info("Index created successfully", 
                       table=table, 
                       columns=columns, 
                       index_name=index_name)
            return True
            
        except Exception as e:
            logger.error("Failed to create index", 
                        table=table, 
                        columns=columns, 
                        error=str(e))
            self.db.rollback()
            return False
    
    def analyze_table_performance(self, table: str) -> Dict[str, Any]:
        """Analyze table performance and suggest optimizations"""
        try:
            # Get table statistics
            stats_query = f"""
                SELECT 
                    schemaname,
                    tablename,
                    attname,
                    n_distinct,
                    correlation,
                    most_common_vals,
                    most_common_freqs
                FROM pg_stats 
                WHERE tablename = '{table}'
            """
            
            result = self.db.execute(text(stats_query))
            stats = [dict(row) for row in result]
            
            # Get table size
            size_query = f"""
                SELECT 
                    pg_size_pretty(pg_total_relation_size('{table}')) as size,
                    pg_total_relation_size('{table}') as size_bytes
            """
            
            size_result = self.db.execute(text(size_query))
            size_info = dict(size_result.fetchone())
            
            # Get index information
            index_query = f"""
                SELECT 
                    indexname,
                    indexdef
                FROM pg_indexes 
                WHERE tablename = '{table}'
            """
            
            index_result = self.db.execute(text(index_query))
            indexes = [dict(row) for row in index_result]
            
            return {
                'table': table,
                'size': size_info,
                'statistics': stats,
                'indexes': indexes,
                'recommendations': self._generate_table_recommendations(stats, indexes)
            }
            
        except Exception as e:
            logger.error("Failed to analyze table performance", table=table, error=str(e))
            return {'error': str(e)}
    
    def _generate_table_recommendations(self, stats: List[Dict], indexes: List[Dict]) -> List[str]:
        """Generate table optimization recommendations"""
        recommendations = []
        
        # Check for columns with high cardinality that might benefit from indexes
        for stat in stats:
            if stat.get('n_distinct', 0) > 1000 and not any(stat['attname'] in idx['indexdef'] for idx in indexes):
                recommendations.append(f"Consider adding index on column '{stat['attname']}' (high cardinality: {stat['n_distinct']})")
        
        # Check for columns with low correlation (good candidates for indexes)
        for stat in stats:
            if abs(stat.get('correlation', 1)) < 0.1 and not any(stat['attname'] in idx['indexdef'] for idx in indexes):
                recommendations.append(f"Consider adding index on column '{stat['attname']}' (low correlation: {stat['correlation']})")
        
        return recommendations


class CacheManager:
    """Advanced caching manager with TTL and invalidation strategies"""
    
    def __init__(self, redis_client: Optional[Redis] = None):
        self.redis_client = redis_client
        self.memory_cache = {}
        self.cache_stats = {
            'hits': 0,
            'misses': 0,
            'sets': 0,
            'deletes': 0
        }
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            if self.redis_client:
                value = self.redis_client.get(key)
                if value:
                    self.cache_stats['hits'] += 1
                    return json.loads(value)
                else:
                    self.cache_stats['misses'] += 1
                    return None
            else:
                # Memory cache
                if key in self.memory_cache:
                    entry = self.memory_cache[key]
                    if time.time() < entry['expires']:
                        self.cache_stats['hits'] += 1
                        return entry['value']
                    else:
                        del self.memory_cache[key]
                
                self.cache_stats['misses'] += 1
                return None
                
        except Exception as e:
            logger.error("Cache get failed", key=key, error=str(e))
            self.cache_stats['misses'] += 1
            return None
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Set value in cache with TTL"""
        try:
            if self.redis_client:
                serialized_value = json.dumps(value, default=str)
                result = self.redis_client.setex(key, ttl, serialized_value)
                self.cache_stats['sets'] += 1
                return result
            else:
                # Memory cache
                self.memory_cache[key] = {
                    'value': value,
                    'expires': time.time() + ttl
                }
                self.cache_stats['sets'] += 1
                return True
                
        except Exception as e:
            logger.error("Cache set failed", key=key, error=str(e))
            return False
    
    def delete(self, key: str) -> bool:
        """Delete value from cache"""
        try:
            if self.redis_client:
                result = self.redis_client.delete(key)
                self.cache_stats['deletes'] += 1
                return bool(result)
            else:
                # Memory cache
                if key in self.memory_cache:
                    del self.memory_cache[key]
                    self.cache_stats['deletes'] += 1
                    return True
                return False
                
        except Exception as e:
            logger.error("Cache delete failed", key=key, error=str(e))
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.cache_stats['hits'] + self.cache_stats['misses']
        hit_rate = (self.cache_stats['hits'] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            **self.cache_stats,
            'hit_rate': hit_rate,
            'total_requests': total_requests,
            'memory_cache_size': len(self.memory_cache) if not self.redis_client else 0
        }


# Global instances
performance_monitor = PerformanceMonitor()
cache_manager = CacheManager(performance_monitor.redis_client)


def cached(ttl: int = 3600, key_prefix: str = ""):
    """Decorator for caching function results"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix}{func.__name__}:{hashlib.md5(str(args).encode() + str(kwargs).encode()).hexdigest()}"
            
            # Try to get from cache
            cached_result = cache_manager.get(cache_key)
            if cached_result is not None:
                logger.debug("Cache hit", function=func.__name__, key=cache_key)
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            cache_manager.set(cache_key, result, ttl)
            logger.debug("Cache set", function=func.__name__, key=cache_key)
            return result
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix}{func.__name__}:{hashlib.md5(str(args).encode() + str(kwargs).encode()).hexdigest()}"
            
            # Try to get from cache
            cached_result = cache_manager.get(cache_key)
            if cached_result is not None:
                logger.debug("Cache hit", function=func.__name__, key=cache_key)
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache_manager.set(cache_key, result, ttl)
            logger.debug("Cache set", function=func.__name__, key=cache_key)
            return result
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator
