"""
Security module for TrueFace application.
Contains rate limiting, security headers, input validation, and other security features.
"""

import os
import re
import hashlib
import secrets
from typing import Callable, Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import bleach


# Security configuration from environment
RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() in ["true", "1", "yes"]
RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "100/minute")
RATE_LIMIT_AUTH = os.getenv("RATE_LIMIT_AUTH", "10/minute")
RATE_LIMIT_UPLOAD = os.getenv("RATE_LIMIT_UPLOAD", "5/minute")
SECURITY_HEADERS_ENABLED = os.getenv("SECURITY_HEADERS_ENABLED", "true").lower() in ["true", "1", "yes"]
CONTENT_SECURITY_POLICY = os.getenv("CONTENT_SECURITY_POLICY", "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'")


def get_client_ip(request: Request) -> str:
    """Get client IP address, considering proxy headers."""
    # Check for forwarded IPs (when behind a proxy/load balancer)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP in the chain (the original client)
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    
    # Fallback to direct connection IP
    return get_remote_address(request)


# Redis configuration for rate limiting
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

# Build Redis connection string
if REDIS_PASSWORD:
    REDIS_URL = REDIS_URL.replace("redis://", f"redis://:{REDIS_PASSWORD}@")

# Create rate limiter instance with Redis backend
limiter = Limiter(
    key_func=get_client_ip,
    default_limits=[RATE_LIMIT_DEFAULT] if RATE_LIMIT_ENABLED else [],
    storage_uri=REDIS_URL if RATE_LIMIT_ENABLED else "memory://",
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom rate limit exceeded handler."""
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please try again later.",
            "retry_after": str(exc.retry_after) if exc.retry_after else None,
        },
        headers={"Retry-After": str(exc.retry_after)} if exc.retry_after else {},
    )


class SecurityHeadersMiddleware:
    """Middleware to add security headers to all responses."""
    
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or not SECURITY_HEADERS_ENABLED:
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = dict(message.get("headers", []))
                
                # Add security headers
                security_headers = {
                    # Prevent clickjacking
                    b"X-Frame-Options": b"DENY",
                    # Prevent MIME type sniffing
                    b"X-Content-Type-Options": b"nosniff",
                    # Enable XSS protection
                    b"X-XSS-Protection": b"1; mode=block",
                    # Prevent information disclosure
                    b"X-Powered-By": b"TrueFace",
                    # Content Security Policy
                    b"Content-Security-Policy": CONTENT_SECURITY_POLICY.encode(),
                    # Referrer Policy
                    b"Referrer-Policy": b"strict-origin-when-cross-origin",
                    # Permissions Policy
                    b"Permissions-Policy": b"geolocation=(), microphone=(), camera=*",
                }
                
                # Add HSTS header for HTTPS
                if scope.get("scheme") == "https":
                    security_headers[b"Strict-Transport-Security"] = b"max-age=31536000; includeSubDomains"
                
                # Merge with existing headers
                for key, value in security_headers.items():
                    headers[key] = value
                
                message["headers"] = list(headers.items())
            
            await send(message)

        await self.app(scope, receive, send_wrapper)


class InputValidationError(Exception):
    """Custom exception for input validation errors."""
    pass


def sanitize_string(value: str, max_length: int = 1000, allow_html: bool = False) -> str:
    """
    Sanitize string input to prevent XSS and injection attacks.
    
    Args:
        value: The string to sanitize
        max_length: Maximum allowed length
        allow_html: Whether to allow safe HTML tags
    
    Returns:
        Sanitized string
    
    Raises:
        InputValidationError: If input is invalid
    """
    if not isinstance(value, str):
        raise InputValidationError("Input must be a string")
    
    if len(value) > max_length:
        raise InputValidationError(f"Input too long (max {max_length} characters)")
    
    # Remove null bytes and control characters
    value = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', value)
    
    if allow_html:
        # Allow only safe HTML tags
        allowed_tags = ['b', 'i', 'u', 'em', 'strong', 'p', 'br']
        allowed_attributes = {}
        value = bleach.clean(value, tags=allowed_tags, attributes=allowed_attributes, strip=True)
    else:
        # Escape HTML entities
        value = bleach.clean(value, tags=[], attributes={}, strip=True)
    
    return value.strip()


def validate_email(email: str) -> str:
    """
    Validate and sanitize email address.
    
    Args:
        email: Email address to validate
    
    Returns:
        Sanitized email address
    
    Raises:
        InputValidationError: If email is invalid
    """
    email = sanitize_string(email, max_length=254)
    
    # Basic email regex (not perfect but catches most issues)
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise InputValidationError("Invalid email format")
    
    return email.lower()


def validate_name(name: str) -> str:
    """
    Validate and sanitize user name.
    
    Args:
        name: Name to validate
    
    Returns:
        Sanitized name
    
    Raises:
        InputValidationError: If name is invalid
    """
    name = sanitize_string(name, max_length=100)
    
    if len(name) < 1:
        raise InputValidationError("Name cannot be empty")
    
    # Allow letters, spaces, hyphens, apostrophes
    if not re.match(r"^[a-zA-Z\s\-'\.]+$", name):
        raise InputValidationError("Name contains invalid characters")
    
    return name


def validate_file_upload(content: bytes, max_size: int = 10 * 1024 * 1024, skip_format_check: bool = False) -> bytes:
    """
    Validate uploaded file content.
    
    Args:
        content: File content bytes
        max_size: Maximum file size in bytes (default 10MB)
    
    Returns:
        Validated content
    
    Raises:
        InputValidationError: If file is invalid
    """
    if len(content) == 0:
        raise InputValidationError("File cannot be empty")
    
    if len(content) > max_size:
        raise InputValidationError(f"File too large (max {max_size//1024//1024}MB)")
    
    # Check for common image magic bytes (JPEG, PNG, WebP) - skip for tests
    if not skip_format_check:
        valid_headers = [
            b'\xFF\xD8\xFF',  # JPEG
            b'\x89PNG\r\n\x1a\n',  # PNG
            b'RIFF',  # WebP (partial)
            b'GIF87a',  # GIF
            b'GIF89a',  # GIF
        ]
        
        is_valid_image = any(content.startswith(header) for header in valid_headers)
        if not is_valid_image:
            raise InputValidationError("Invalid image format")
    
    return content


def hash_sensitive_data(data: str) -> str:
    """
    Hash sensitive data for logging/audit purposes.
    
    Args:
        data: Sensitive data to hash
    
    Returns:
        SHA-256 hash of the data
    """
    return hashlib.sha256(data.encode()).hexdigest()[:16]  # First 16 characters


def generate_secure_token(length: int = 32) -> str:
    """
    Generate a cryptographically secure random token.
    
    Args:
        length: Length of the token in bytes
    
    Returns:
        Hex-encoded secure token
    """
    return secrets.token_hex(length)


def validate_admin_credentials(username: str, password: str) -> tuple[str, str]:
    """
    Validate admin login credentials.
    
    Args:
        username: Admin username
        password: Admin password
    
    Returns:
        Tuple of (sanitized_username, password)
    
    Raises:
        InputValidationError: If credentials are invalid
    """
    username = sanitize_string(username, max_length=50)
    if len(username) < 3:
        raise InputValidationError("Username too short")
    
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        raise InputValidationError("Username contains invalid characters")
    
    if len(password) < 6:
        raise InputValidationError("Password too short")
    
    if len(password) > 128:
        raise InputValidationError("Password too long")
    
    return username, password


def get_security_context(request: Request) -> dict:
    """
    Get security context information for logging and monitoring.
    
    Args:
        request: FastAPI request object
    
    Returns:
        Dictionary with security context
    """
    return {
        "client_ip": get_client_ip(request),
        "user_agent": request.headers.get("User-Agent", "")[:200],
        "referer": request.headers.get("Referer", "")[:200],
        "method": request.method,
        "url": str(request.url)[:500],
        "timestamp": request.state.__dict__.get("request_timestamp"),
    }


# Rate limiting decorators for different endpoint types
def rate_limit_auth(func):
    """Decorator for authentication endpoints."""
    if RATE_LIMIT_ENABLED:
        return limiter.limit(RATE_LIMIT_AUTH)(func)
    return func


def rate_limit_upload(func):
    """Decorator for file upload endpoints."""
    if RATE_LIMIT_ENABLED:
        return limiter.limit(RATE_LIMIT_UPLOAD)(func)
    return func


def rate_limit_default(func):
    """Decorator for general API endpoints."""
    if RATE_LIMIT_ENABLED:
        return limiter.limit(RATE_LIMIT_DEFAULT)(func)
    return func
