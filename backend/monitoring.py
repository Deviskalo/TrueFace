"""
Monitoring and metrics module for TrueFace application.
Provides Prometheus metrics collection and custom business metrics.
"""

import time
import os
from typing import Dict, Any
from prometheus_client import Counter, Histogram, Gauge, Info
from prometheus_fastapi_instrumentator import Instrumentator, metrics
from fastapi import Request, Response
import psutil

# Configuration
METRICS_ENABLED = os.getenv("METRICS_ENABLED", "true").lower() in ["true", "1", "yes"]
METRICS_PREFIX = "trueface"

# Custom metrics
if METRICS_ENABLED:
    # Business metrics
    face_recognition_requests = Counter(
        f'{METRICS_PREFIX}_face_recognition_requests_total',
        'Total number of face recognition requests',
        ['action', 'status']
    )
    
    face_recognition_confidence = Histogram(
        f'{METRICS_PREFIX}_face_recognition_confidence',
        'Face recognition confidence scores',
        ['action'],
        buckets=(0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99, 1.0)
    )
    
    face_processing_duration = Histogram(
        f'{METRICS_PREFIX}_face_processing_duration_seconds',
        'Time spent processing face images',
        ['action'],
        buckets=(0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0)
    )
    
    active_users = Gauge(
        f'{METRICS_PREFIX}_active_users',
        'Number of currently active users'
    )
    
    active_sessions = Gauge(
        f'{METRICS_PREFIX}_active_sessions',
        'Number of active user sessions'
    )
    
    database_operations = Counter(
        f'{METRICS_PREFIX}_database_operations_total',
        'Total database operations',
        ['operation', 'collection', 'status']
    )
    
    rate_limit_hits = Counter(
        f'{METRICS_PREFIX}_rate_limit_hits_total',
        'Total rate limit hits',
        ['endpoint', 'limit_type']
    )
    
    # System metrics
    memory_usage = Gauge(
        f'{METRICS_PREFIX}_memory_usage_bytes',
        'Current memory usage in bytes'
    )
    
    cpu_usage = Gauge(
        f'{METRICS_PREFIX}_cpu_usage_percent',
        'Current CPU usage percentage'
    )
    
    # Application info
    app_info = Info(
        f'{METRICS_PREFIX}_app_info',
        'Application information'
    )
    
    # Set application info
    app_info.info({
        'version': os.getenv('APP_VERSION', 'dev'),
        'environment': os.getenv('NODE_ENV', 'development'),
        'python_version': os.sys.version.split()[0],
    })


def create_instrumentator():
    """Create and configure Prometheus instrumentator."""
    if not METRICS_ENABLED:
        return None
    
    instrumentator = Instrumentator(
        should_group_status_codes=True,
        should_ignore_unhealthy=True,
        should_respect_env_var=True,
        should_instrument_requests_inprogress=True,
        excluded_handlers=["/metrics", "/health", "/docs", "/redoc", "/openapi.json"],
        env_var_name="ENABLE_METRICS",
        inprogress_name=f"{METRICS_PREFIX}_requests_inprogress",
        inprogress_labels=True,
    )
    
    # Add default metrics
    instrumentator.add(metrics.default())
    instrumentator.add(metrics.combined_size())
    
    # Add custom request duration metric
    instrumentator.add(
        metrics.request_size(
            should_include_handler=True,
            should_include_method=True,
            metric_name=f"{METRICS_PREFIX}_request_size_bytes",
        )
    )
    
    instrumentator.add(
        metrics.response_size(
            should_include_handler=True,
            should_include_method=True,
            metric_name=f"{METRICS_PREFIX}_response_size_bytes",
        )
    )
    
    return instrumentator


def record_face_recognition_request(action: str, status: str, confidence: float = None, duration: float = None):
    """Record face recognition request metrics."""
    if not METRICS_ENABLED:
        return
    
    face_recognition_requests.labels(action=action, status=status).inc()
    
    if confidence is not None:
        face_recognition_confidence.labels(action=action).observe(confidence)
    
    if duration is not None:
        face_processing_duration.labels(action=action).observe(duration)


def record_database_operation(operation: str, collection: str, status: str):
    """Record database operation metrics."""
    if not METRICS_ENABLED:
        return
    
    database_operations.labels(
        operation=operation, 
        collection=collection, 
        status=status
    ).inc()


def record_rate_limit_hit(endpoint: str, limit_type: str):
    """Record rate limit hit metrics."""
    if not METRICS_ENABLED:
        return
    
    rate_limit_hits.labels(endpoint=endpoint, limit_type=limit_type).inc()


def update_system_metrics():
    """Update system resource metrics."""
    if not METRICS_ENABLED:
        return
    
    try:
        # Memory usage
        memory_info = psutil.virtual_memory()
        memory_usage.set(memory_info.used)
        
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=None)
        cpu_usage.set(cpu_percent)
    except Exception:
        # Silently ignore errors in metrics collection
        pass


def update_business_metrics(user_count: int = None, session_count: int = None):
    """Update business metrics."""
    if not METRICS_ENABLED:
        return
    
    if user_count is not None:
        active_users.set(user_count)
    
    if session_count is not None:
        active_sessions.set(session_count)


class FaceRecognitionTimer:
    """Context manager for timing face recognition operations."""
    
    def __init__(self, action: str):
        self.action = action
        self.start_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if METRICS_ENABLED and self.start_time:
            duration = time.time() - self.start_time
            face_processing_duration.labels(action=self.action).observe(duration)


def custom_metrics_middleware():
    """Custom middleware function for additional metrics collection."""
    def middleware(request: Request, response: Response, process_time: float):
        if not METRICS_ENABLED:
            return
        
        # Update system metrics periodically
        update_system_metrics()
        
        # Record specific endpoint metrics
        path = request.url.path
        method = request.method
        status_code = response.status_code
        
        # Track authentication endpoints
        if path.startswith('/api/auth/'):
            action = path.split('/')[-1]  # login, signup, logout
            status = 'success' if 200 <= status_code < 300 else 'error'
            record_face_recognition_request(f'auth_{action}', status, duration=process_time)
        
        # Track face processing endpoints
        elif path.startswith('/api/face/'):
            action = path.split('/')[-1]  # enroll, verify, recognize
            status = 'success' if 200 <= status_code < 300 else 'error'
            record_face_recognition_request(f'face_{action}', status, duration=process_time)
    
    return middleware


# Metrics collection functions for database layer
def with_db_metrics(operation: str, collection: str):
    """Decorator to add database metrics to operations."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
                record_database_operation(operation, collection, 'success')
                return result
            except Exception as e:
                record_database_operation(operation, collection, 'error')
                raise
        return wrapper
    return decorator
