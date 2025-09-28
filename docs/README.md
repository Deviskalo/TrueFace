# TrueFace Documentation

Welcome to TrueFace, a modern face recognition authentication platform built with Next.js and FastAPI. This documentation will help you understand, deploy, and customize TrueFace for your needs.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Features](#features)
- [API Reference](#api-reference)
- [Frontend Components](#frontend-components)
- [Authentication & Security](#authentication--security)
- [Admin Dashboard](#admin-dashboard)
- [Deployment Guide](#deployment-guide)
- [Monitoring & Observability](#monitoring--observability)
- [Database Schema](#database-schema)
- [Configuration](#configuration)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Contributing](#contributing)

---

## Overview

TrueFace is an enterprise-grade face recognition authentication system that provides:

- **Secure Authentication**: Biometric authentication using face recognition
- **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS
- **Scalable Backend**: FastAPI-powered REST API with enterprise features
- **Production Ready**: Docker deployment, monitoring, and operational tools
- **Developer Friendly**: Comprehensive APIs, documentation, and development tools

### Key Technologies

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11+, Pydantic, Uvicorn
- **Database**: MongoDB with schema validation
- **Cache**: Redis for rate limiting and sessions
- **ML/AI**: Face recognition with ONNX models
- **Monitoring**: Prometheus, Grafana
- **Deployment**: Docker, Docker Compose, Nginx

---

## Quick Start

Get TrueFace running in under 5 minutes:

### Prerequisites

- Python 3.11+
- Node.js 18.x LTS
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd TrueFace

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend setup (new terminal)
cd frontend
npm install

# Start development servers
# Terminal 1: Backend
cd backend && DEV_MODE_NO_DB=true uvicorn main:app --reload

# Terminal 2: Frontend  
cd frontend && npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see TrueFace in action!

> **Development Mode**: The `DEV_MODE_NO_DB=true` flag runs TrueFace with mock data, perfect for testing without database setup.

### First Steps

1. **Sign Up**: Create a user account with face enrollment
2. **Login**: Authenticate using your face
3. **Explore**: Check user profile, sessions, and history
4. **Admin**: Access admin dashboard at `/admin` (admin/admin123)

---

## Architecture

TrueFace follows a modern, scalable architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (MongoDB)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       
         │              ┌─────────────────┐              
         │              │                 │              
         └─────────────►│   Nginx Proxy   │              
                        │   (Production)  │              
                        └─────────────────┘              
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │                 │    │                 │
                    │   Monitoring    │    │   Cache/Queue   │
                    │ (Prometheus)    │    │    (Redis)      │
                    └─────────────────┘    └─────────────────┘
```

### Component Overview

**Frontend (Next.js)**
- Server-side rendering (SSR) and static generation
- TypeScript for type safety
- Tailwind CSS for styling
- Real-time camera integration
- Responsive design

**Backend (FastAPI)**
- Async/await for high performance
- Automatic OpenAPI documentation
- Pydantic for data validation
- JWT authentication
- Rate limiting and security middleware

**Database (MongoDB)**
- Document-based storage for flexibility
- Schema validation for data integrity
- Optimized indexes for performance
- Built-in authentication and authorization

**Infrastructure**
- **Nginx**: Reverse proxy, SSL termination, load balancing
- **Redis**: Caching, rate limiting, session storage
- **Prometheus**: Metrics collection and monitoring
- **Grafana**: Visualization and alerting

---

## Features

### 🔐 Authentication Features

- **Face Recognition**: State-of-the-art ML models for accurate recognition
- **Multi-Face Support**: Enroll multiple faces per user
- **Liveness Detection**: Anti-spoofing measures (planned)
- **Session Management**: JWT tokens with configurable expiry
- **Account Security**: Session revocation, login history

### 👤 User Management

- **User Profiles**: Name, email, face data management
- **Admin Dashboard**: User administration, system monitoring
- **Role-Based Access**: User and admin roles
- **Account Controls**: Enable/disable accounts, audit logs

### 🛡️ Security Features

- **Rate Limiting**: Configurable limits per endpoint type
- **Input Validation**: Comprehensive sanitization and validation
- **Security Headers**: CSP, HSTS, XSS protection
- **CORS Protection**: Configurable cross-origin policies
- **Audit Logging**: Complete action tracking

### 📊 Monitoring & Analytics

- **Prometheus Metrics**: Application and business metrics
- **Health Checks**: Automated service monitoring
- **Performance Tracking**: Response times, success rates
- **Admin Analytics**: User growth, authentication trends
- **Error Tracking**: Comprehensive error logging

### 🔧 Developer Features

- **OpenAPI Documentation**: Auto-generated API docs
- **Type Safety**: Full TypeScript support
- **Development Mode**: Mock data for testing
- **Hot Reload**: Fast development iteration
- **Testing**: Comprehensive test suites

---

## API Reference

### Authentication Endpoints

#### POST `/api/auth/signup`

Create a new user account with face enrollment.

**Request:**
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "image=@face_photo.jpg"
```

**Response:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### POST `/api/auth/login`

Authenticate user with face recognition.

**Request:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -F "image=@face_photo.jpg"
```

**Response:**
```json
{
  "match": {
    "user_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "confidence": 0.95,
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

#### POST `/api/auth/logout`

Revoke current session.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "revoked": true
}
```

### User Management Endpoints

#### GET `/api/user/profile`

Get current user's profile information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "profile": {
    "user_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "face_count": 2,
    "created_at": "2025-01-28T10:30:00Z"
  }
}
```

#### GET `/api/user/sessions`

Get user's active sessions.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "sessions": [
    {
      "session_id": "sess_123",
      "created_at": "2025-01-28T10:30:00Z",
      "expires_at": "2025-01-28T11:30:00Z",
      "current": true
    }
  ]
}
```

#### POST `/api/user/sessions/revoke-all`

Revoke all sessions except current.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "revoked_count": 3
}
```

### Face Processing Endpoints

#### POST `/api/face/enroll`

Enroll additional face for current user.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```bash
curl -X POST http://localhost:8000/api/face/enroll \
  -H "Authorization: Bearer <token>" \
  -F "image=@new_face_photo.jpg"
```

**Response:**
```json
{
  "enrolled": true
}
```

#### POST `/api/face/verify`

Verify face matches current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "verified": true,
  "confidence": 0.92
}
```

#### POST `/api/face/recognize`

Recognize face against all users (public endpoint).

**Response:**
```json
{
  "candidates": [
    {
      "user_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "confidence": 0.95
    }
  ]
}
```

### Admin Endpoints

All admin endpoints require `Authorization: Bearer <admin_token>`.

#### POST `/api/admin/login`

Admin authentication.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

#### GET `/api/admin/stats`

System statistics for dashboard.

**Response:**
```json
{
  "stats": {
    "total_users": 150,
    "active_sessions": 23,
    "recent_signups_7d": 12,
    "recent_logins_24h": 45,
    "total_authentications": 1250,
    "success_rate": 0.94
  }
}
```

#### GET `/api/admin/users`

User management data.

**Query Parameters:**
- `limit`: Number of users (default: 50)
- `offset`: Offset for pagination (default: 0)

#### POST `/api/admin/users/disable`

Disable a user account.

**Request:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "reason": "Policy violation"
}
```

### Health & Monitoring

#### GET `/health`

Application health check.

**Response:**
```json
{
  "status": "ok",
  "db": {"reachable": true},
  "mongo_uri": "mongodb://***@mongo:27017/trueface_prod",
  "dev_mode": false
}
```

#### GET `/metrics`

Prometheus metrics endpoint.

**Response:** Prometheus format metrics

---

## Frontend Components

### Core Components

#### CameraCapture

Handles camera access and image capture for face recognition.

**Props:**
```typescript
interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onError?: (error: string) => void;
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}
```

**Usage:**
```tsx
import CameraCapture from '@/components/CameraCapture';

function SignupPage() {
  const handleCapture = (imageData: string) => {
    // Process captured image
    console.log('Captured image:', imageData);
  };

  return (
    <CameraCapture 
      onCapture={handleCapture}
      width={640}
      height={480}
    />
  );
}
```

#### AuthLayout

Shared layout component for authentication pages.

**Features:**
- Responsive design
- Loading states
- Error handling
- Background patterns

**Usage:**
```tsx
import AuthLayout from '@/components/AuthLayout';

function LoginPage() {
  return (
    <AuthLayout title="Login to TrueFace">
      {/* Your login form */}
    </AuthLayout>
  );
}
```

### Page Components

#### Dashboard (`/dashboard`)

Main user dashboard with navigation and user info.

**Features:**
- User profile summary
- Quick actions (profile, sessions, history)
- Recent activity feed
- Navigation menu

#### User Profile (`/profile`)

User profile management page.

**Features:**
- Display user information
- Face enrollment count
- Account creation date
- Profile editing (planned)

#### Sessions Management (`/sessions`)

Active session management.

**Features:**
- List active sessions
- Session details (device, location, time)
- Revoke individual or all sessions
- Current session highlighting

#### Authentication History (`/history`)

User authentication history and logs.

**Features:**
- Chronological activity list
- Action types (login, verify, enroll)
- Confidence scores
- Timestamp and metadata

#### Admin Dashboard (`/admin`)

Comprehensive admin interface.

**Features:**
- System statistics overview
- User management table
- Analytics charts
- Real-time metrics

### API Hooks

#### useAuth

Authentication state management hook.

```tsx
import { useAuth } from '@/hooks/useAuth';

function ProtectedComponent() {
  const { user, isLoading, login, logout } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;
  
  return <div>Welcome, {user.name}!</div>;
}
```

#### useApi

Generic API request hook with error handling.

```tsx
import { useApi } from '@/hooks/useApi';

function UserProfile() {
  const { data, error, isLoading } = useApi('/api/user/profile');
  
  if (error) return <div>Error: {error.message}</div>;
  if (isLoading) return <div>Loading...</div>;
  
  return <div>{data?.profile?.name}</div>;
}
```

---

## Authentication & Security

### JWT Authentication

TrueFace uses JSON Web Tokens (JWT) for stateless authentication.

**Token Structure:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "session_id": "sess_123",
  "role": "user",
  "exp": 1643723400,
  "iat": 1643719800
}
```

**Token Lifecycle:**
1. User authenticates via face recognition
2. Server generates JWT with user/session info
3. Client includes token in Authorization header
4. Server validates token on each request
5. Token expires after configured time (default: 1 hour)

### Session Management

Sessions provide additional security layer:

- **Creation**: New session created on successful login
- **Validation**: Each request validates both JWT and session status
- **Revocation**: Sessions can be revoked individually or in bulk
- **Expiry**: Automatic cleanup of expired sessions

### Security Features

#### Rate Limiting

Configurable rate limits prevent abuse:

```python
# Authentication endpoints: 10 requests/minute
@rate_limit_auth
def login(): ...

# File uploads: 5 requests/minute  
@rate_limit_upload
def enroll_face(): ...

# General API: 100 requests/minute
@rate_limit_default
def get_profile(): ...
```

#### Input Validation

Comprehensive validation prevents injection attacks:

```python
from security import validate_email, validate_name, validate_file_upload

# Email validation with regex and sanitization
email = validate_email("user@example.com")

# Name validation with character restrictions
name = validate_name("John Doe")

# File validation with magic byte checking
image_data = validate_file_upload(file_content)
```

#### Security Headers

Automatic security headers on all responses:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; ...
```

#### CORS Protection

Configurable cross-origin resource sharing:

```python
# Development
CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"

# Production  
CORS_ORIGINS = "https://trueface.example.com"
```

### Face Recognition Security

#### Anti-Spoofing (Planned)

Future versions will include:
- **Liveness Detection**: Detect photo/video attacks
- **3D Analysis**: Depth-based verification
- **Behavioral Biometrics**: Movement pattern analysis

#### Confidence Thresholds

Recognition confidence determines authentication success:

```python
DEFAULT_THRESHOLD = 0.7  # 70% confidence minimum
HIGH_SECURITY_THRESHOLD = 0.9  # 90% for sensitive operations
```

#### Data Protection

- **Encryption**: Face embeddings encrypted at rest
- **Anonymization**: No raw images stored
- **Access Control**: Strict database permissions
- **Audit Logging**: Complete action tracking

---

## Admin Dashboard

The admin dashboard provides comprehensive system management capabilities.

### Access & Authentication

**URL**: `/admin`  
**Credentials**: `admin` / `admin123` (change in production!)  
**Token**: Admin JWT with extended expiry (4 hours)

### Dashboard Sections

#### Overview Tab

System health and key metrics:

- **Total Users**: Registered user count
- **Active Sessions**: Current active sessions
- **Success Rate**: Authentication success percentage
- **Recent Activity**: New signups and logins
- **System Health**: Database and service status

#### Users Tab

User management interface:

- **User List**: Paginated table with user details
- **User Info**: Name, email, face count, creation date
- **Account Status**: Active/disabled status with reasons
- **Actions**: Disable users with reason tracking
- **Search & Filter**: Find users by criteria (planned)

#### Analytics Tab

Data visualization and insights:

- **User Growth**: Daily signup trends
- **Authentication Trends**: Success/failure over time
- **Confidence Distribution**: Recognition accuracy metrics
- **Popular Actions**: Most common user activities
- **Performance Metrics**: Response times, error rates

#### Logs Tab (Planned)

System logs and audit trails:

- **Action Logs**: User authentication and admin actions
- **Error Logs**: System errors and exceptions
- **Security Events**: Failed attempts, unusual activity
- **Performance Logs**: Slow queries, high load events

### Admin API Features

#### User Management

```typescript
// Get all users with pagination
GET /api/admin/users?limit=50&offset=0

// Disable user account
POST /api/admin/users/disable
{
  "user_id": "507f1f77bcf86cd799439011",
  "reason": "Policy violation"
}

// Enable user account (planned)
POST /api/admin/users/enable
{
  "user_id": "507f1f77bcf86cd799439011"
}
```

#### System Statistics

```typescript
// Get system stats
GET /api/admin/stats

// Get detailed analytics  
GET /api/admin/analytics?days=30

// Get system logs
GET /api/admin/logs?limit=100&action_filter=login
```

### Security Features

- **Admin-Only Access**: Separate authentication system
- **Action Logging**: All admin actions tracked
- **IP Restrictions**: Limit admin access by IP (configurable)
- **Session Timeout**: Shorter session duration
- **Audit Trail**: Complete history of admin operations

---

## Deployment Guide

### Production Architecture

```
Internet → Nginx (SSL) → Frontend + Backend → MongoDB + Redis
                      ↓
               Prometheus + Grafana
```

### Deployment Options

#### 1. Docker Compose (Recommended)

Complete stack deployment with one command:

```bash
# Production deployment
./deploy.prod.sh

# Or manually
docker-compose -f docker-compose.prod.yml up -d
```

**Services Included:**
- Frontend (Next.js) on port 3000
- Backend (FastAPI) on port 8000  
- MongoDB with authentication on port 27017
- Redis for caching on port 6379
- Nginx reverse proxy on ports 80/443
- Prometheus monitoring on port 9090
- Grafana dashboard on port 3001

#### 2. Kubernetes (Advanced)

For large-scale deployments:

```yaml
# kubernetes/deployment.yaml (example)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trueface-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: trueface-backend
  template:
    metadata:
      labels:
        app: trueface-backend
    spec:
      containers:
      - name: backend
        image: ghcr.io/your-org/trueface-backend:latest
        ports:
        - containerPort: 8000
```

#### 3. Cloud Platforms

**AWS Deployment:**
- ECS Fargate for containers
- RDS for MongoDB (DocumentDB)
- ElastiCache for Redis
- ALB for load balancing
- CloudWatch for monitoring

**Google Cloud:**
- Cloud Run for containers
- Atlas MongoDB
- Memorystore for Redis
- Cloud Load Balancing
- Cloud Monitoring

### Environment Configuration

#### Production Secrets

Generate secure values:

```bash
# JWT secret (32+ characters)
openssl rand -hex 32

# Database passwords
openssl rand -base64 32

# Redis password  
openssl rand -base64 24
```

#### SSL Certificates

**Option 1: Let's Encrypt (Free)**
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy to nginx directory
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/private.key
```

**Option 2: Commercial Certificate**
```bash
# Place your certificate files
# nginx/ssl/cert.pem (certificate + intermediate)  
# nginx/ssl/private.key (private key)
```

#### Environment Variables

Copy and configure production environment:

```bash
cp .env.prod.example .env.prod
```

**Critical variables to set:**
```bash
# Security (CHANGE THESE!)
JWT_SECRET=your-64-char-secret-here
MONGO_ROOT_PASSWORD=your-strong-db-password
REDIS_PASSWORD=your-redis-password

# Domain configuration  
CORS_ORIGINS=https://your-domain.com
DOMAIN_NAME=your-domain.com

# Database
MONGO_URI=mongodb://trueface_app:password@mongo:27017/trueface_prod?authSource=admin

# Monitoring
GRAFANA_PASSWORD=your-grafana-password
```

### Scaling Considerations

#### Horizontal Scaling

Scale backend services:

```yaml
# docker-compose.prod.yml
backend:
  # ... existing config
  deploy:
    replicas: 3
  
# Add load balancer
nginx:
  # Configure upstream servers
  # See nginx/nginx.prod.conf
```

#### Database Scaling

**MongoDB Replica Set:**
```yaml
mongo-1:
  image: mongo:6.0
  command: mongod --replSet rs0
  
mongo-2:
  image: mongo:6.0  
  command: mongod --replSet rs0
  
mongo-3:
  image: mongo:6.0
  command: mongod --replSet rs0
```

**Redis Cluster:**
```yaml
redis-1:
  image: redis:7-alpine
  command: redis-server --cluster-enabled yes
```

#### Performance Optimization

**Backend Optimization:**
- Increase worker processes: `--workers 4`
- Enable async I/O: Built-in FastAPI async support
- Connection pooling: MongoDB and Redis pools
- Caching: Redis for frequent queries

**Frontend Optimization:**  
- Static generation: Next.js SSG for landing pages
- Image optimization: Next.js built-in optimization
- CDN: Serve static assets from CDN
- Code splitting: Automatic with Next.js

### Monitoring Setup

#### Prometheus Configuration

Metrics collection from all services:

```yaml
# monitoring/prometheus.yml
scrape_configs:
  - job_name: 'trueface-backend'
    static_configs:
      - targets: ['backend:8000']
    scrape_interval: 10s

  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongo-exporter:9216']
```

#### Grafana Dashboards

Import pre-built dashboards:

1. **System Overview**: CPU, memory, disk usage
2. **Application Metrics**: Request rates, response times
3. **Business Metrics**: User signups, authentication success
4. **Error Tracking**: Failed requests, exceptions

#### Alerting Rules

Configure alerts for critical issues:

```yaml
# monitoring/alerts.yml  
groups:
- name: trueface-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    annotations:
      summary: "High error rate detected"
      
  - alert: DatabaseDown  
    expr: up{job="mongodb"} == 0
    annotations:
      summary: "MongoDB is down"
```

---

## Monitoring & Observability

TrueFace includes comprehensive monitoring capabilities built on Prometheus and Grafana.

### Metrics Collection

#### Application Metrics

**HTTP Metrics (Automatic):**
- Request count by endpoint and status
- Response time histograms  
- Request/response size
- Active connections

**Business Metrics (Custom):**
```python
# Face recognition requests
face_recognition_requests_total{action="login", status="success"} 245
face_recognition_requests_total{action="login", status="error"} 12

# Recognition confidence scores
face_recognition_confidence{action="login"} 0.95

# Processing times
face_processing_duration_seconds{action="login"} 0.245
```

**System Metrics:**
- CPU usage percentage
- Memory usage (bytes)
- Active users count
- Active sessions count
- Database operations

#### Infrastructure Metrics

**MongoDB Metrics:**
- Connection count
- Query performance
- Index usage
- Replication lag

**Redis Metrics:**  
- Memory usage
- Key count
- Command rates
- Cache hit ratio

**Nginx Metrics:**
- Request rates
- Response codes
- Upstream health
- SSL certificate expiry

### Dashboards

#### System Overview Dashboard

Key performance indicators:

- **Request Rate**: Requests per second across all endpoints
- **Error Rate**: Percentage of failed requests (4xx/5xx)
- **Response Time**: P50, P95, P99 percentiles
- **System Resources**: CPU, memory, disk usage
- **Service Health**: Up/down status of all components

#### Business Intelligence Dashboard

User behavior and business metrics:

- **User Growth**: Daily, weekly, monthly signup trends  
- **Authentication Success**: Login success rates over time
- **Recognition Accuracy**: Confidence score distributions
- **Popular Features**: Most used endpoints and actions
- **Geographic Distribution**: User locations (if enabled)

#### Security Dashboard

Security monitoring and threat detection:

- **Failed Authentication Attempts**: By IP, user, time
- **Rate Limiting**: Blocked requests by endpoint
- **Suspicious Activity**: Unusual patterns or behaviors  
- **Access Patterns**: Admin actions, privilege escalation
- **Compliance**: Audit log completeness, retention

### Alerting

#### Critical Alerts

**Service Availability:**
```yaml
# Service down
up{job="trueface-backend"} == 0
up{job="mongodb"} == 0
up{job="redis"} == 0

# High error rate
rate(http_requests_total{status=~"5.."}[5m]) > 0.05
```

**Performance Issues:**
```yaml
# Slow response times
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2.0

# High CPU usage
cpu_usage_percent > 80

# Low memory
memory_usage_bytes / memory_total_bytes > 0.90
```

#### Business Alerts

**Security Issues:**
```yaml
# High failed login rate
rate(face_recognition_requests_total{action="login", status="error"}[5m]) > 0.1

# Rate limiting triggered
rate(rate_limit_hits_total[5m]) > 10
```

**Operational Issues:**
```yaml
# Low recognition confidence
histogram_quantile(0.50, rate(face_recognition_confidence_bucket[10m])) < 0.7

# Database backup failures
increase(backup_failures_total[1d]) > 0
```

### Observability Best Practices

#### Structured Logging

Use consistent log formats:

```python
import logging
import structlog

# Configure structured logging
logging.basicConfig(
    format="%(message)s",
    stream=sys.stdout,
    level=logging.INFO,
)

logger = structlog.get_logger()

# Log with context
logger.info(
    "user_authentication",
    user_id="507f1f77bcf86cd799439011",
    action="login",
    confidence=0.95,
    duration_ms=245,
    success=True
)
```

#### Distributed Tracing

Trace requests across services:

```python
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter

# Initialize tracing
tracer = trace.get_tracer(__name__)

@app.middleware("http")
async def tracing_middleware(request, call_next):
    with tracer.start_as_current_span("http_request"):
        response = await call_next(request)
        return response
```

#### Health Checks

Comprehensive health monitoring:

```python
@app.get("/health")
def health_check():
    checks = {
        "database": check_database_health(),
        "redis": check_redis_health(),  
        "ml_model": check_model_health(),
        "external_apis": check_external_apis()
    }
    
    overall_status = "healthy" if all(checks.values()) else "unhealthy"
    
    return {
        "status": overall_status,
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat()
    }
```

---

## Database Schema

TrueFace uses MongoDB with schema validation for data integrity.

### Collections Overview

```javascript
// Database: trueface_prod
db.users           // User accounts and face embeddings
db.sessions        // Active user sessions  
db.logs           // Action and audit logs
db.admin_users    // Admin accounts
```

### Users Collection

Stores user accounts and biometric data:

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "John Doe",                    // Full name
  email: "john@example.com",           // Unique email address
  faces: [                             // Array of face embeddings
    [0.123, -0.456, 0.789, ...],     // 512-dimensional vector
    [0.234, -0.567, 0.890, ...]      // Additional face enrollment
  ],
  created_at: ISODate("2025-01-28T10:30:00Z"),
  disabled: false,                     // Account status
  disabled_reason: null,               // Reason if disabled
  disabled_at: null                    // When disabled
}
```

**Indexes:**
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ created_at: -1 })
db.users.createIndex({ disabled: 1 })
```

**Validation Schema:**
```javascript
{
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "email", "faces", "created_at"],
    properties: {
      name: { bsonType: "string", maxLength: 100 },
      email: { 
        bsonType: "string", 
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        maxLength: 254 
      },
      faces: { 
        bsonType: "array",
        items: { bsonType: "array" }
      }
    }
  }
}
```

### Sessions Collection

Manages user authentication sessions:

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  user_id: ObjectId("507f1f77bcf86cd799439011"),  // Reference to user
  created_at: ISODate("2025-01-28T10:30:00Z"),
  expires_at: ISODate("2025-01-28T11:30:00Z"),    // 1 hour expiry
  active: true                                     // Session status
}
```

**Indexes:**
```javascript
db.sessions.createIndex({ user_id: 1 })
db.sessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 })  // TTL
db.sessions.createIndex({ active: 1 })
```

### Logs Collection

Tracks all user actions and system events:

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  user_id: ObjectId("507f1f77bcf86cd799439011"),
  action: "login",                      // signup, login, enroll, verify, etc.
  timestamp: ISODate("2025-01-28T10:30:00Z"),
  confidence: 0.95,                     // Recognition confidence (0-1)
  metadata: {                           // Additional context
    email: "john@example.com",
    ip_address: "192.168.1.100",
    user_agent: "Mozilla/5.0...",
    duration_ms: 245
  },
  success: true                         // Action outcome
}
```

**Indexes:**
```javascript
db.logs.createIndex({ user_id: 1, timestamp: -1 })
db.logs.createIndex({ timestamp: -1 })
db.logs.createIndex({ action: 1 })
```

### Admin Users Collection

Stores admin account information:

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439014"),
  username: "admin",                    // Unique username
  password_hash: "$2b$10$92IXUNpkjO0rOQ5byMi...",  // bcrypt hash
  email: "admin@trueface.local",
  created_at: ISODate("2025-01-28T10:00:00Z"),
  last_login: ISODate("2025-01-28T10:30:00Z")
}
```

**Indexes:**
```javascript
db.admin_users.createIndex({ username: 1 }, { unique: true })
db.admin_users.createIndex({ email: 1 }, { unique: true })
```

### Database Operations

#### User Management

```python
# Create user with face embedding
def create_user(name: str, email: str, embedding: List[float]) -> str:
    user_doc = {
        "name": name,
        "email": email,
        "faces": [embedding],
        "created_at": datetime.utcnow(),
        "disabled": False
    }
    result = db.users.insert_one(user_doc)
    return str(result.inserted_id)

# Find best face match
def find_best_match(embedding: List[float]) -> Optional[Dict]:
    users = db.users.find({"disabled": False})
    
    best_match = None
    best_score = 0
    
    for user in users:
        for face in user["faces"]:
            similarity = cosine_similarity(embedding, face)
            if similarity > best_score and similarity > THRESHOLD:
                best_score = similarity
                best_match = {
                    "user_id": str(user["_id"]),
                    "name": user["name"],
                    "confidence": similarity
                }
    
    return best_match
```

#### Session Management

```python
# Create session with expiry
def create_session_with_expiry(user_id: str, minutes: int) -> str:
    session_doc = {
        "user_id": ObjectId(user_id),
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=minutes),
        "active": True
    }
    result = db.sessions.insert_one(session_doc)
    return str(result.inserted_id)

# Validate session
def is_session_active(session_id: str) -> bool:
    session = db.sessions.find_one({
        "_id": ObjectId(session_id),
        "active": True,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    return session is not None
```

### Data Migration

For schema changes, use migration scripts:

```javascript
// migrations/001_add_disabled_fields.js
db.users.updateMany(
  { disabled: { $exists: false } },
  { 
    $set: { 
      disabled: false,
      disabled_reason: null,
      disabled_at: null 
    } 
  }
);
```

### Backup & Restore

Regular automated backups:

```bash
# Backup script (scripts/backup-database.sh)
mongodump --host mongo:27017 \
  --db trueface_prod \
  --username trueface_readonly \
  --password $MONGO_READONLY_PASSWORD \
  --out /backups/mongodb/backup_$(date +%Y%m%d_%H%M%S)

# Restore script (scripts/restore-database.sh)  
mongorestore --host mongo:27017 \
  --db trueface_prod \
  --username admin \
  --password $MONGO_ROOT_PASSWORD \
  /backups/mongodb/backup_20250128_103000/trueface_prod
```

---

## Configuration

TrueFace is highly configurable through environment variables and configuration files.

### Environment Variables

#### Core Application

```bash
# Application Settings
NODE_ENV=production                    # development, production
DEV_MODE_NO_DB=false                  # Skip database for testing
TEST_MODE=false                       # Relaxed validation for tests
LOG_LEVEL=info                        # debug, info, warning, error

# Server Configuration
HOST=0.0.0.0                         # Bind address
BACKEND_PORT=8000                    # Backend port  
FRONTEND_PORT=3000                   # Frontend port
WORKERS=4                            # Number of worker processes
```

#### Database Configuration

```bash
# MongoDB Settings
MONGO_URI=mongodb://user:pass@host:27017/db?authSource=admin
MONGO_DB_NAME=trueface_prod
MONGO_HOST=mongo                     # Docker service name
MONGO_PORT=27017
MONGO_ROOT_USER=admin               # Admin user
MONGO_ROOT_PASSWORD=changeme123      # Admin password
MONGO_APP_PASSWORD=changeme789       # App user password
MONGO_READONLY_PASSWORD=readonly123  # Readonly user password

# Connection Pool Settings
MONGO_MIN_POOL_SIZE=1               # Minimum connections
MONGO_MAX_POOL_SIZE=10              # Maximum connections
MONGO_TIMEOUT_MS=5000               # Connection timeout
```

#### Security Configuration

```bash
# JWT Authentication
JWT_SECRET=your-super-secure-secret-at-least-32-characters-long
SESSION_EXPIRES_MINUTES=60           # Token expiry (user)
ADMIN_SESSION_MINUTES=240           # Admin token expiry

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_DEFAULT=100/minute       # General API limits
RATE_LIMIT_AUTH=10/minute           # Authentication limits  
RATE_LIMIT_UPLOAD=5/minute          # File upload limits

# Redis Configuration (for distributed rate limiting)
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=your-redis-password

# CORS Settings
CORS_ORIGINS=https://trueface.com,https://app.trueface.com

# Security Headers
SECURITY_HEADERS_ENABLED=true
CONTENT_SECURITY_POLICY="default-src 'self'; img-src 'self' data: blob:;"
```

#### Face Recognition Settings

```bash
# Recognition Thresholds
FACE_RECOGNITION_THRESHOLD=0.7      # Minimum confidence for match
HIGH_SECURITY_THRESHOLD=0.9         # High security operations
LOW_CONFIDENCE_WARNING=0.8          # Warning threshold

# Model Configuration  
ONNX_MODEL_PATH=models/face_embedding.onnx
MODEL_INPUT_SIZE=160                # Input image size
EMBEDDING_DIMENSION=512             # Output vector dimension

# Image Processing
MAX_IMAGE_SIZE=10MB                 # Maximum upload size
SUPPORTED_FORMATS=jpg,jpeg,png,webp # Allowed image types
IMAGE_QUALITY=85                    # JPEG compression quality
```

#### Monitoring & Logging

```bash
# Prometheus Metrics
METRICS_ENABLED=true
METRICS_PORT=8001                   # Metrics endpoint port
PROMETHEUS_RETENTION_TIME=15d       # Data retention

# Logging Configuration
LOG_FORMAT=json                     # json, text
LOG_FILE=logs/app.log              # Log file path
LOG_MAX_SIZE=100MB                 # Max log file size
LOG_BACKUP_COUNT=5                 # Number of backup files

# Grafana Settings
GRAFANA_PASSWORD=your-grafana-password
GRAFANA_PORT=3001
```

#### Backup & Maintenance

```bash
# Backup Settings
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"         # Daily at 2 AM (cron format)
BACKUP_RETENTION_DAYS=30            # Keep backups for 30 days
BACKUP_COMPRESSION=true             # Compress backup files
BACKUP_LOCATION=/backups/mongodb    # Backup directory

# Notification Settings  
NOTIFICATION_EMAIL=admin@company.com # Backup notifications
NOTIFICATION_WEBHOOK=https://hooks.slack.com/... # Webhook URL
SMTP_HOST=smtp.company.com          # Email server
SMTP_PORT=587                       # Email port
SMTP_USER=notifications@company.com # SMTP username
SMTP_PASSWORD=smtp-password         # SMTP password
```

### Configuration Files

#### Next.js Configuration

```typescript
// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production build optimization
  output: 'standalone',
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' }
        ],
      },
    ];
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Image optimization
  images: {
    domains: ['localhost', 'your-domain.com'],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
```

#### Nginx Configuration

```nginx
# nginx/nginx.prod.conf
server {
    listen 443 ssl http2;
    server_name trueface.example.com;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "DENY" always;
    
    # Rate Limiting  
    limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    
    # Backend API
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend:8000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend  
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'trueface-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 10s
    
  - job_name: 'trueface-frontend'  
    static_configs:
      - targets: ['frontend:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### Docker Configuration

#### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: "3.9"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=${REDIS_URL}
      - METRICS_ENABLED=true
    restart: unless-stopped
    
  frontend:
    build:
      context: ./frontend  
      dockerfile: Dockerfile.prod
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - NODE_ENV=production
    restart: unless-stopped
```

### Feature Flags

Control features without code deployment:

```python
# backend/config.py
FEATURES = {
    "liveness_detection": os.getenv("FEATURE_LIVENESS", "false").lower() == "true",
    "multi_face_enrollment": os.getenv("FEATURE_MULTI_FACE", "true").lower() == "true", 
    "admin_analytics": os.getenv("FEATURE_ANALYTICS", "true").lower() == "true",
    "email_notifications": os.getenv("FEATURE_EMAIL", "false").lower() == "true",
}

# Usage in code
if FEATURES["liveness_detection"]:
    perform_liveness_check()
```

### Configuration Validation

Validate configuration on startup:

```python
# backend/config_validator.py
def validate_config():
    errors = []
    
    # Check required variables
    required_vars = ["JWT_SECRET", "MONGO_URI"]
    for var in required_vars:
        if not os.getenv(var):
            errors.append(f"Missing required environment variable: {var}")
    
    # Validate JWT secret strength
    jwt_secret = os.getenv("JWT_SECRET", "")
    if len(jwt_secret) < 32:
        errors.append("JWT_SECRET must be at least 32 characters")
    
    # Check database connectivity
    try:
        db.admin.command('ping')
    except Exception as e:
        errors.append(f"Database connection failed: {e}")
    
    if errors:
        for error in errors:
            logger.error(error)
        raise ConfigurationError("Configuration validation failed")
```

---

## Development

### Development Setup

#### Local Development Environment

```bash
# Clone repository
git clone <repository-url>
cd TrueFace

# Backend development
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install development dependencies
pip install black flake8 isort pytest-cov

# Frontend development
cd ../frontend  
npm install
npm install -D @types/jest @testing-library/react
```

#### Development Commands

**Backend Development:**
```bash
# Start with auto-reload
DEV_MODE_NO_DB=true uvicorn main:app --reload --host 0.0.0.0

# Run tests
TEST_MODE=true DEV_MODE_NO_DB=true pytest -v

# Code formatting
black .
isort .
flake8 .

# Type checking
mypy . --ignore-missing-imports
```

**Frontend Development:**
```bash
# Development server
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint
npm run lint:fix

# Building
npm run build
npm start
```

### Code Style

#### Python (Backend)

Follow PEP 8 with these tools:

```bash
# Install tools
pip install black isort flake8 mypy

# Format code
black --line-length 100 .
isort --profile black .

# Lint code  
flake8 --max-line-length 100 --ignore E203,W503 .

# Type check
mypy . --ignore-missing-imports
```

**Configuration files:**

```toml
# pyproject.toml
[tool.black]
line-length = 100
target-version = ['py311']

[tool.isort]  
profile = "black"
line_length = 100

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
```

#### TypeScript (Frontend)

ESLint and Prettier configuration:

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}

// prettier.config.js
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
};
```

### Testing

#### Backend Testing

```python
# tests/test_api.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()

def test_signup_with_valid_data():
    """Test user signup with valid face image."""
    response = client.post(
        "/api/auth/signup",
        files={"image": ("face.jpg", b"fake-image-data", "image/jpeg")},
        data={"name": "Test User", "email": "test@example.com"}
    )
    assert response.status_code == 200
    assert "user_id" in response.json()

@pytest.fixture
def auth_headers():
    """Fixture providing authentication headers."""
    # Create test user and return auth headers
    response = client.post("/api/auth/signup", ...)
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}

def test_protected_endpoint(auth_headers):
    """Test protected endpoint with authentication."""
    response = client.get("/api/user/profile", headers=auth_headers)
    assert response.status_code == 200
```

**Running tests:**
```bash
# Run all tests
TEST_MODE=true DEV_MODE_NO_DB=true pytest

# Run with coverage
TEST_MODE=true DEV_MODE_NO_DB=true pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_api.py -v
```

#### Frontend Testing

```typescript
// __tests__/components/CameraCapture.test.tsx
import { render, screen } from '@testing-library/react';
import CameraCapture from '@/components/CameraCapture';

describe('CameraCapture', () => {
  test('renders camera component', () => {
    const mockOnCapture = jest.fn();
    
    render(<CameraCapture onCapture={mockOnCapture} />);
    
    expect(screen.getByText(/camera/i)).toBeInTheDocument();
  });

  test('handles capture event', async () => {
    const mockOnCapture = jest.fn();
    
    render(<CameraCapture onCapture={mockOnCapture} />);
    
    // Simulate camera capture
    // ... test implementation
  });
});
```

### Database Development

#### Working with MongoDB

```python
# Local MongoDB setup
from pymongo import MongoClient

# Connect to database
client = MongoClient("mongodb://localhost:27017/")
db = client.trueface_dev

# Create indexes
db.users.create_index([("email", 1)], unique=True)
db.sessions.create_index([("expires_at", 1)], expireAfterSeconds=0)

# Sample data for development
sample_user = {
    "name": "John Doe",
    "email": "john@example.com", 
    "faces": [[0.1, 0.2, 0.3] * 170],  # 512-dim embedding
    "created_at": datetime.utcnow()
}
db.users.insert_one(sample_user)
```

#### Database Migrations

```python
# migrations/001_add_disabled_fields.py
def upgrade(db):
    """Add disabled fields to users collection."""
    db.users.update_many(
        {"disabled": {"$exists": False}},
        {"$set": {
            "disabled": False,
            "disabled_reason": None,
            "disabled_at": None
        }}
    )

def downgrade(db):
    """Remove disabled fields from users collection."""
    db.users.update_many(
        {},
        {"$unset": {
            "disabled": "",
            "disabled_reason": "",
            "disabled_at": ""
        }}
    )
```

### Debugging

#### Backend Debugging

```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Use debugger
import pdb; pdb.set_trace()

# Or with ipdb for better experience  
import ipdb; ipdb.set_trace()

# Log performance
import time
start_time = time.time()
# ... code to measure
duration = time.time() - start_time
logger.info(f"Operation took {duration:.2f} seconds")
```

#### Frontend Debugging

```typescript
// Browser debugging
console.log('Debug info:', data);
console.table(users);
console.time('api-call');
// ... API call
console.timeEnd('api-call');

// React DevTools
// Install React Developer Tools browser extension

// Network debugging
// Use browser DevTools Network tab to inspect API calls
```

### Performance Optimization

#### Backend Optimization

```python
# Database query optimization
# Use projection to limit fields
users = db.users.find({}, {"name": 1, "email": 1})

# Use indexes effectively
db.users.find({"email": email}).hint([("email", 1)])

# Connection pooling
from pymongo import MongoClient
client = MongoClient(
    "mongodb://localhost:27017/",
    maxPoolSize=50,
    minPoolSize=5
)

# Async operations
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def async_database_operation():
    client = AsyncIOMotorClient("mongodb://localhost:27017/")
    db = client.trueface_dev
    result = await db.users.find_one({"email": email})
    return result
```

#### Frontend Optimization

```typescript
// Code splitting
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

// Memoization
const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return processData(data);
  }, [data]);
  
  return <div>{processedData}</div>;
});

// Image optimization
import Image from 'next/image';

<Image
  src="/hero-image.jpg"
  alt="TrueFace"
  width={800}
  height={600}
  priority
  placeholder="blur"
/>
```

---

## Troubleshooting

Common issues and solutions for TrueFace deployment and development.

### Installation Issues

#### Python Version Conflicts

**Problem**: `Python version 3.11+ required`

**Solution**:
```bash
# Check current version
python --version

# Install Python 3.11 (Ubuntu/Debian)
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev

# Use specific version
python3.11 -m venv venv
source venv/bin/activate
python --version  # Should show 3.11.x
```

#### Node.js Version Issues  

**Problem**: `Node.js 18.x required for Next.js`

**Solution**:
```bash
# Install Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 18
nvm install 18
nvm use 18
node --version  # Should show v18.x.x
```

#### Package Installation Failures

**Problem**: `pip install` or `npm install` fails

**Solution**:
```bash
# Clear pip cache
pip cache purge
pip install --no-cache-dir -r requirements.txt

# Clear npm cache  
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Runtime Issues

#### Database Connection Failed

**Problem**: `Database unavailable. Please start MongoDB or check MONGO_URI`

**Solutions**:

1. **Development Mode** (bypass database):
```bash
DEV_MODE_NO_DB=true uvicorn main:app --reload
```

2. **Local MongoDB**:
```bash
# Install MongoDB
sudo apt install mongodb
sudo systemctl start mongodb
sudo systemctl status mongodb

# Test connection
mongosh
```

3. **Docker MongoDB**:
```bash
docker run -d -p 27017:27017 --name mongo mongo:6.0
```

4. **Check connection string**:
```bash
# Verify MONGO_URI format
export MONGO_URI="mongodb://localhost:27017/trueface_dev"
echo $MONGO_URI
```

#### Face Recognition Errors

**Problem**: `No face detected` or `Invalid image format`

**Solutions**:

1. **Check image format**:
```python
# Supported formats: JPEG, PNG, WebP, GIF
# Max size: 10MB by default
```

2. **Test with known good image**:
```bash
# Use a clear, well-lit face photo
# Ensure face is clearly visible and centered
curl -X POST http://localhost:8000/api/auth/signup \
  -F "image=@clear_face_photo.jpg" \
  -F "name=Test User" \
  -F "email=test@example.com"
```

3. **Enable test mode** (relaxed validation):
```bash
TEST_MODE=true uvicorn main:app --reload
```

#### Rate Limiting Issues

**Problem**: `Rate limit exceeded. Please try again later.`

**Solutions**:

1. **Disable for development**:
```bash
RATE_LIMIT_ENABLED=false uvicorn main:app --reload
```

2. **Adjust limits**:
```bash
export RATE_LIMIT_AUTH=50/minute
export RATE_LIMIT_UPLOAD=20/minute
```

3. **Check IP address** (if behind proxy):
```bash
# Ensure X-Forwarded-For header is set correctly
curl -H "X-Forwarded-For: 192.168.1.100" http://localhost:8000/api/auth/login
```

### Docker Issues

#### Container Build Failures

**Problem**: Docker build fails or containers won't start

**Solutions**:

1. **Check Docker status**:
```bash
docker info
docker-compose version
```

2. **Build with verbose output**:
```bash
docker-compose build --no-cache --progress=plain
```

3. **Check logs**:
```bash
docker-compose logs backend
docker-compose logs frontend
```

4. **Resource limits**:
```bash
# Increase Docker memory (Docker Desktop)
# Settings > Resources > Advanced > Memory: 4GB+
```

#### Port Conflicts

**Problem**: `Port already in use`

**Solutions**:

1. **Find process using port**:
```bash
lsof -i :3000
lsof -i :8000
```

2. **Kill process**:
```bash
kill -9 <PID>
```

3. **Use different ports**:
```bash
PORT=3001 npm run dev
uvicorn main:app --port 8001
```

#### Volume Mount Issues

**Problem**: Files not syncing between host and container

**Solutions**:

1. **Check mount paths**:
```yaml
# docker-compose.yml
volumes:
  - ./backend:/app  # Local path : Container path
```

2. **File permissions**:
```bash
# Fix permissions (Linux)
sudo chown -R $USER:$USER .
chmod -R 755 .
```

### Performance Issues

#### Slow API Responses

**Problem**: API requests taking too long

**Debugging**:
```bash
# Check response times
curl -w "@curl-format.txt" http://localhost:8000/api/user/profile

# curl-format.txt:
#      time_namelookup:  %{time_namelookup}\n
#         time_connect:  %{time_connect}\n
#      time_appconnect:  %{time_appconnect}\n
#         time_total:    %{time_total}\n
```

**Solutions**:

1. **Enable performance monitoring**:
```bash
METRICS_ENABLED=true uvicorn main:app --reload
# Check metrics at http://localhost:8000/metrics
```

2. **Database optimization**:
```python
# Add indexes for frequent queries
db.users.create_index([("email", 1)])
db.logs.create_index([("user_id", 1), ("timestamp", -1)])
```

3. **Enable caching**:
```bash
# Use Redis for caching
REDIS_URL=redis://localhost:6379
```

#### High Memory Usage

**Problem**: Application consuming too much memory

**Solutions**:

1. **Monitor memory usage**:
```bash
# System memory
free -h
top -p $(pgrep -f "uvicorn\|node")

# Docker container memory
docker stats
```

2. **Optimize Python**:
```bash
# Use fewer workers
uvicorn main:app --workers 1

# Enable garbage collection
export PYTHONOPTIMIZE=1
```

3. **Optimize Node.js**:
```bash
# Limit Node.js memory
node --max-old-space-size=512 server.js
```

### Security Issues

#### HTTPS Certificate Errors

**Problem**: SSL/TLS certificate issues in production

**Solutions**:

1. **Verify certificate files**:
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Check private key
openssl rsa -in nginx/ssl/private.key -check
```

2. **Generate self-signed certificate** (development):
```bash
openssl req -x509 -newkey rsa:2048 -keyout nginx/ssl/private.key \
  -out nginx/ssl/cert.pem -days 365 -nodes \
  -subj "/CN=localhost"
```

3. **Let's Encrypt certificate** (production):
```bash
sudo certbot certonly --standalone -d your-domain.com
cp /etc/letsencrypt/live/your-domain.com/*.pem nginx/ssl/
```

#### Authentication Failures

**Problem**: JWT token validation failures

**Debugging**:
```bash
# Decode JWT token (without verification)
echo "eyJ0eXAiOiJKV1..." | base64 -d

# Check token expiry
python -c "
import jwt
token = 'your-jwt-token'
decoded = jwt.decode(token, options={'verify_signature': False})
print(decoded)
"
```

**Solutions**:

1. **Check JWT secret**:
```bash
# Ensure JWT_SECRET is set and consistent
echo $JWT_SECRET | wc -c  # Should be 32+ characters
```

2. **Verify token format**:
```bash
# Tokens should start with "Bearer "
curl -H "Authorization: Bearer eyJ0eXAi..." http://localhost:8000/api/user/profile
```

### Monitoring Issues

#### Metrics Not Appearing

**Problem**: Prometheus metrics not collected

**Solutions**:

1. **Check metrics endpoint**:
```bash
curl http://localhost:8000/metrics
```

2. **Verify Prometheus configuration**:
```yaml
# monitoring/prometheus.yml
scrape_configs:
  - job_name: 'trueface-backend'
    static_configs:
      - targets: ['backend:8000']  # Correct service name
```

3. **Check Docker network**:
```bash
docker-compose exec prometheus wget -qO- http://backend:8000/metrics
```

#### Grafana Dashboard Issues

**Problem**: Grafana not showing data

**Solutions**:

1. **Verify data source**:
   - URL: `http://prometheus:9090`
   - Access: Server (default)

2. **Test Prometheus queries**:
```promql
# Test in Prometheus UI (http://localhost:9090)
up{job="trueface-backend"}
rate(http_requests_total[5m])
```

3. **Check time range** in Grafana dashboard

### Getting Help

#### Log Collection

When reporting issues, include relevant logs:

```bash
# Application logs
docker-compose logs --tail=100 backend frontend

# System logs
journalctl -u docker --since "1 hour ago"

# Database logs
docker-compose logs mongo

# Nginx logs (if using)
docker-compose logs nginx
```

#### Debug Information

Include system information:

```bash
# System info
uname -a
docker --version
docker-compose --version
python --version
node --version

# Resource usage
df -h
free -h
docker system df
```

#### Creating Bug Reports

When creating issues, include:

1. **Environment details**
2. **Steps to reproduce**  
3. **Expected vs actual behavior**
4. **Error messages and logs**
5. **Configuration files** (with secrets removed)

---

## FAQ

### General Questions

**Q: What is TrueFace?**
A: TrueFace is an open-source face recognition authentication platform that allows users to sign up and log in using their face instead of passwords. It's built with modern technologies like Next.js and FastAPI.

**Q: Is TrueFace ready for production?**  
A: Yes! TrueFace includes enterprise-grade features like security hardening, monitoring, backup systems, and Docker deployment configurations suitable for production use.

**Q: What technologies does TrueFace use?**
A: 
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11+, Pydantic
- **Database**: MongoDB with schema validation
- **ML/AI**: ONNX models for face recognition
- **Infrastructure**: Docker, Nginx, Redis, Prometheus, Grafana

### Security & Privacy

**Q: How secure is face recognition authentication?**
A: TrueFace implements multiple security layers:
- Face embeddings are encrypted (not raw images stored)
- JWT tokens with configurable expiry
- Rate limiting to prevent brute force attacks  
- Session management with revocation capabilities
- Comprehensive audit logging

**Q: Is my face data stored safely?**
A: Yes. TrueFace stores mathematical representations (embeddings) of your face, not actual photos. These embeddings are encrypted and cannot be reverse-engineered back into images.

**Q: Can TrueFace be fooled by photos?**  
A: Current version focuses on accuracy over anti-spoofing. Liveness detection and 3D analysis are planned for future releases to prevent photo/video attacks.

**Q: What happens if someone else looks similar to me?**
A: TrueFace uses configurable confidence thresholds (default 70%). Similar-looking people typically won't exceed this threshold, but you can increase it for higher security (90%+ for sensitive applications).

### Setup & Deployment

**Q: What are the minimum system requirements?**
A: 
- **Development**: 4GB RAM, 2GB disk space
- **Production**: 8GB RAM, 10GB disk space  
- **OS**: Linux, macOS, or Windows with WSL2
- **Dependencies**: Python 3.11+, Node.js 18.x

**Q: Can I run TrueFace without a database?**
A: Yes! Use `DEV_MODE_NO_DB=true` to run with mock data, perfect for testing and development without MongoDB setup.

**Q: How do I deploy TrueFace to production?**
A: Use the provided deployment script:
```bash
cp .env.prod.example .env.prod
# Configure your production values
./deploy.prod.sh
```

This sets up the complete stack with Docker, including SSL certificates and monitoring.

**Q: Can TrueFace scale horizontally?**
A: Yes. The architecture supports:
- Multiple backend instances with Redis-based rate limiting
- Load balancing with Nginx
- MongoDB replica sets for database scaling
- Containerized deployment for cloud platforms

### Development & Customization

**Q: How do I add new features to TrueFace?**
A: 
1. Read the [Contributing Guide](../CONTRIBUTING.md)
2. Set up development environment per [Setup Guide](../SETUP.md)  
3. Create feature branch: `git checkout -b feature/my-feature`
4. Write tests and implement feature
5. Submit pull request with clear description

**Q: Can I customize the UI/UX?**
A: Absolutely! TrueFace uses Tailwind CSS for styling. Modify components in `frontend/app/` and `frontend/components/` directories. The design system is modular and easy to customize.

**Q: How do I integrate TrueFace with my existing system?**
A: TrueFace provides a complete REST API documented at `/docs`. You can:
- Use the API endpoints directly
- Modify the frontend to integrate with your design system
- Add custom authentication logic
- Extend the database schema for additional user data

**Q: Can I use different face recognition models?**
A: Yes. Replace the ONNX model in `backend/models/face_embedding.onnx` with your trained model. Ensure the input/output dimensions match or update the preprocessing code accordingly.

### Troubleshooting

**Q: The camera won't work in my browser**
A: Camera access requires:
- **HTTPS** in production (browsers block camera on HTTP)
- **User permission** (browser will prompt)
- **Supported browser** (Chrome, Firefox, Safari, Edge)

For local development, browsers allow camera access on `localhost`.

**Q: I get "No face detected" errors**
A: Ensure:
- Image is well-lit with clear face visibility
- Face is centered and not at extreme angles
- Image format is supported (JPEG, PNG, WebP, GIF)
- File size is under 10MB

For testing, use `TEST_MODE=true` to relax validation.

**Q: Authentication is slow**
A: Performance tips:
- Use smaller image files (compress before upload)
- Enable Redis caching for faster rate limiting
- Optimize database with proper indexes
- Use multiple backend workers in production
- Monitor metrics at `/metrics` endpoint

**Q: Database connection fails**
A: Check:
- MongoDB is running: `docker ps` or `systemctl status mongod`
- Connection string format: `mongodb://user:pass@host:port/db`
- Network connectivity from backend to database
- Authentication credentials are correct

For development, use `DEV_MODE_NO_DB=true` to bypass database.

### Business & Legal

**Q: What license does TrueFace use?**
A: TrueFace is released under the MIT License, allowing free use, modification, and distribution for both commercial and non-commercial purposes.

**Q: Is TrueFace GDPR compliant?**
A: TrueFace includes features that help with GDPR compliance:
- Data encryption at rest
- User data deletion capabilities
- Audit logging for data access
- Configurable data retention policies

However, full compliance depends on your implementation and usage. Consult legal experts for specific requirements.

**Q: Can I use TrueFace commercially?**  
A: Yes! The MIT license allows commercial use. You can:
- Deploy TrueFace for your business
- Modify and redistribute the code
- Offer TrueFace as a service
- Integrate it into commercial products

**Q: What about patent issues with face recognition?**
A: TrueFace uses standard machine learning techniques and open ONNX models. However, the face recognition field has various patents. Consider consulting IP lawyers for commercial deployments.

### Advanced Usage

**Q: How do I backup and restore TrueFace data?**
A: TrueFace includes automated backup scripts:
```bash
# Manual backup
./scripts/backup-database.sh

# Restore from backup  
./scripts/restore-database.sh /path/to/backup.tar.gz

# Schedule daily backups
echo "0 2 * * * /path/to/TrueFace/scripts/backup-database.sh" | crontab -
```

**Q: How do I monitor TrueFace in production?**
A: TrueFace includes comprehensive monitoring:
- **Prometheus metrics** at `/metrics`
- **Grafana dashboards** at port 3001
- **Health checks** at `/health`
- **Admin analytics** at `/admin`

Set up alerts for critical metrics like error rates and response times.

**Q: Can I deploy TrueFace on Kubernetes?**
A: While TrueFace includes Docker Compose configuration, it can be adapted for Kubernetes. Create Deployment, Service, and ConfigMap resources based on the provided Docker configuration.

**Q: How do I handle high traffic loads?**
A: Scale TrueFace using:
- **Horizontal scaling**: Multiple backend replicas
- **Load balancing**: Nginx upstream configuration
- **Caching**: Redis for sessions and rate limiting  
- **Database optimization**: MongoDB replica sets
- **CDN**: For static assets

### Support

**Q: Where can I get help?**
A: 
1. Check this FAQ and [Troubleshooting](#troubleshooting) section
2. Review the [Setup Guide](../SETUP.md) for common issues
3. Search existing [GitHub Issues](../../issues)
4. Create a new issue with detailed information
5. Join community discussions in GitHub Discussions

**Q: How do I report security vulnerabilities?**
A: Please report security issues privately to the maintainers via GitHub Security Advisories or direct contact. Do not create public issues for security vulnerabilities.

**Q: Can I contribute to TrueFace development?**
A: Yes! We welcome contributions:
- **Code**: Bug fixes, features, performance improvements
- **Documentation**: Guides, examples, API documentation  
- **Testing**: Writing tests, reporting bugs
- **Community**: Helping others, reviewing pull requests

See the [Contributing Guide](../CONTRIBUTING.md) for details.

---

## Contributing

We welcome contributions to TrueFace! Whether you're fixing bugs, adding features, improving documentation, or helping other users, your contributions make TrueFace better for everyone.

### Ways to Contribute

- 🐛 **Report Bugs**: Found an issue? Let us know!
- 💡 **Suggest Features**: Have ideas for improvements?
- 🔧 **Fix Issues**: Help resolve existing problems
- 📚 **Improve Docs**: Make our documentation better
- 🧪 **Write Tests**: Increase test coverage
- 💬 **Help Others**: Answer questions in discussions

### Getting Started

1. **Read the [Contributing Guide](../CONTRIBUTING.md)** for detailed guidelines
2. **Set up your development environment** using the [Setup Guide](../SETUP.md)  
3. **Look for "good first issue" labels** on GitHub for beginner-friendly tasks
4. **Join the community discussions** to connect with other contributors

### Development Process

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/TrueFace.git
cd TrueFace

# 2. Create a feature branch
git checkout -b feature/amazing-feature

# 3. Make your changes
# Follow code style guidelines and write tests

# 4. Test your changes
npm run test        # Frontend tests
pytest             # Backend tests

# 5. Submit a pull request
git push origin feature/amazing-feature
# Create PR on GitHub with clear description
```

### Code of Conduct

We're committed to providing a welcoming and inclusive environment. Please:

- Be respectful and constructive in all interactions
- Welcome newcomers and help them get started
- Focus on what's best for the community
- Show empathy towards other community members

### Recognition

Contributors are recognized in:
- GitHub contributor graphs
- Release notes for significant contributions  
- Special thanks in major releases
- Community highlights in discussions

Thank you for helping make TrueFace better! 🎉

---

**Need more help?** Check out our [Setup Guide](../SETUP.md) or [Contributing Guide](../CONTRIBUTING.md), or create an issue on GitHub.

**TrueFace** - Secure, Modern Face Recognition Authentication  
Built with ❤️ by the open source community
