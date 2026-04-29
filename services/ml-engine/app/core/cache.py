"""
ML Engine Service Cache Utilities
"""

import json
import pickle
from typing import Any, Optional, Union
import redis
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)


class CacheManager:
    """Redis cache manager for ML Engine Service"""
    
    def __init__(self):
        self.redis_client = redis.from_url(settings.REDIS_URL)
        self.default_ttl = settings.CACHE_TTL
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set a value in cache"""
        try:
            if isinstance(value, (dict, list)):
                serialized_value = json.dumps(value)
            else:
                serialized_value = pickle.dumps(value)
            
            return self.redis_client.setex(
                key, 
                ttl or self.default_ttl, 
                serialized_value
            )
        except Exception as e:
            logger.error("Failed to set cache value", key=key, error=str(e))
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from cache"""
        try:
            value = self.redis_client.get(key)
            if value is None:
                return None
            
            # Try to deserialize as JSON first, then pickle
            try:
                return json.loads(value)
            except (json.JSONDecodeError, UnicodeDecodeError):
                return pickle.loads(value)
                
        except Exception as e:
            logger.error("Failed to get cache value", key=key, error=str(e))
            return None
    
    def delete(self, key: str) -> bool:
        """Delete a value from cache"""
        try:
            return bool(self.redis_client.delete(key))
        except Exception as e:
            logger.error("Failed to delete cache value", key=key, error=str(e))
            return False
    
    def exists(self, key: str) -> bool:
        """Check if a key exists in cache"""
        try:
            return bool(self.redis_client.exists(key))
        except Exception as e:
            logger.error("Failed to check cache key existence", key=key, error=str(e))
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching a pattern"""
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error("Failed to clear cache pattern", pattern=pattern, error=str(e))
            return 0
    
    def get_cache_key(self, prefix: str, **kwargs) -> str:
        """Generate a cache key from prefix and parameters"""
        params = sorted(kwargs.items())
        param_str = "_".join(f"{k}_{v}" for k, v in params)
        return f"ml_engine:{prefix}:{param_str}"
    
    def cache_result(self, prefix: str, ttl: Optional[int] = None, **kwargs):
        """Decorator to cache function results"""
        def decorator(func):
            def wrapper(*args, **func_kwargs):
                # Generate cache key
                cache_key = self.get_cache_key(prefix, **kwargs)
                
                # Try to get from cache
                cached_result = self.get(cache_key)
                if cached_result is not None:
                    logger.debug("Cache hit", key=cache_key)
                    return cached_result
                
                # Execute function and cache result
                result = func(*args, **func_kwargs)
                self.set(cache_key, result, ttl)
                logger.debug("Cache miss, stored result", key=cache_key)
                
                return result
            return wrapper
        return decorator


# Global cache manager instance
cache_manager = CacheManager()
