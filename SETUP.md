# TrueFace Setup Guide

This guide will help you set up TrueFace for local development or production deployment.

## Table of Contents
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Docker Setup](#docker-setup)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Quick Start

For the fastest setup (development mode with mocked data):

```bash
# Clone the repository
git clone <repository-url>
cd TrueFace

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup (in another terminal)
cd ../frontend
npm install

# Start development servers
# Terminal 1 (backend):
cd backend
DEV_MODE_NO_DB=true uvicorn main:app --reload

# Terminal 2 (frontend):
cd frontend
npm run dev
```

Visit http://localhost:3000 to access the application!

## Prerequisites

### Required Software
- **Python 3.11+** (for backend)
- **Node.js 18.x LTS** (for frontend)
- **Git** (for version control)

### Optional (for production)
- **Docker & Docker Compose** (recommended for production)
- **MongoDB 6.0+** (if not using Docker)
- **Redis 7.x** (for distributed rate limiting)

### System Requirements
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Disk**: 2GB free space for development, 10GB+ for production
- **OS**: Linux, macOS, or Windows with WSL2

## Local Development

### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run in development mode (no database required)
DEV_MODE_NO_DB=true uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### 2. Frontend Setup (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Or with custom port
PORT=3001 npm run dev
```

The frontend will be available at: http://localhost:3000

### 3. Development with Real Database

If you want to use a real MongoDB database:

```bash
# Install MongoDB locally or use MongoDB Atlas

# Set environment variables
export MONGO_URI="mongodb://localhost:27017/trueface_dev"
export JWT_SECRET="your-development-jwt-secret-here"
export DEV_MODE_NO_DB=false

# Start backend
uvicorn main:app --reload
```

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the backend directory:

```bash
# Database Configuration
MONGO_URI=mongodb://localhost:27017/trueface_dev
MONGO_DB_NAME=trueface_dev

# Security
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-chars
SESSION_EXPIRES_MINUTES=60

# Development Settings
DEV_MODE_NO_DB=false
TEST_MODE=false

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_DEFAULT=100/minute
RATE_LIMIT_AUTH=10/minute
RATE_LIMIT_UPLOAD=5/minute

# Redis (optional, for distributed rate limiting)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# CORS Settings
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Security Headers
SECURITY_HEADERS_ENABLED=true
CONTENT_SECURITY_POLICY="default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'"

# Monitoring
METRICS_ENABLED=true
LOG_LEVEL=info
```

### Frontend Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Development Settings
NODE_ENV=development
```

### Production Environment Variables

For production, copy `.env.prod.example` to `.env.prod` and configure:

```bash
# Copy the example file
cp .env.prod.example .env.prod

# Edit with your production values
nano .env.prod  # or your preferred editor
```

Key production variables to change:
- `JWT_SECRET`: Generate with `openssl rand -hex 32`
- `MONGO_ROOT_PASSWORD`: Strong MongoDB password
- `REDIS_PASSWORD`: Strong Redis password
- `GRAFANA_PASSWORD`: Grafana admin password
- `CORS_ORIGINS`: Your actual domain(s)

## Docker Setup

### Development with Docker

```bash
# Start all services in development mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production with Docker

```bash
# Ensure you have a .env.prod file configured
cp .env.prod.example .env.prod
# Edit .env.prod with your production values

# Deploy to production
./deploy.prod.sh

# Or manually:
docker-compose -f docker-compose.prod.yml up -d

# Check service health
docker-compose -f docker-compose.prod.yml ps
```

### Docker Services Overview

The production setup includes:
- **Frontend**: Next.js application (port 3000)
- **Backend**: FastAPI service (port 8000)
- **MongoDB**: Database with authentication (port 27017)
- **Redis**: Cache and rate limiting (port 6379)
- **Nginx**: Reverse proxy with SSL (ports 80, 443)
- **Prometheus**: Metrics collection (port 9090)
- **Grafana**: Monitoring dashboard (port 3001)

## Production Deployment

### Using the Deployment Script

```bash
# Make the script executable
chmod +x deploy.prod.sh

# Run the deployment
./deploy.prod.sh
```

The script will:
1. Validate your environment configuration
2. Generate SSL certificates (if needed)
3. Build and start all services
4. Run health checks
5. Provide service URLs and useful commands

### Manual Production Setup

1. **Prepare Environment**:
   ```bash
   cp .env.prod.example .env.prod
   # Edit .env.prod with production values
   ```

2. **Generate Secure Secrets**:
   ```bash
   # JWT Secret
   openssl rand -hex 32

   # MongoDB Password
   openssl rand -base64 32

   # Redis Password
   openssl rand -base64 24
   ```

3. **SSL Certificates**:
   ```bash
   mkdir -p nginx/ssl
   # Place your SSL certificate files:
   # nginx/ssl/cert.pem
   # nginx/ssl/private.key
   ```

4. **Deploy**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Database Initialization

The production MongoDB will be automatically initialized with:
- Application user: `trueface_app`
- Read-only user: `trueface_readonly`
- Default admin user: `admin` (password: `admin123`)
- Proper indexes and schema validation

**⚠️ Important**: Change the default admin password in production!

### Backup Setup

Schedule regular backups using the provided script:

```bash
# Test backup
./scripts/backup-database.sh

# Add to crontab for daily backups at 2 AM
echo "0 2 * * * /path/to/TrueFace/scripts/backup-database.sh" | crontab -
```

## Troubleshooting

### Common Issues

**Backend won't start**:
- Check Python version: `python --version` (should be 3.11+)
- Ensure virtual environment is activated
- Install dependencies: `pip install -r requirements.txt`

**Frontend build fails**:
- Check Node.js version: `node --version` (should be 18.x)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check for TypeScript errors: `npx tsc --noEmit`

**Database connection fails**:
- Ensure MongoDB is running: `docker ps` or `systemctl status mongod`
- Check connection string in environment variables
- For development, use `DEV_MODE_NO_DB=true` to bypass database

**Docker issues**:
- Ensure Docker is running: `docker info`
- Check ports are available: `netstat -tlnp | grep :3000`
- View container logs: `docker-compose logs <service-name>`

**Rate limiting too strict**:
- Adjust limits in environment variables
- Disable for development: `RATE_LIMIT_ENABLED=false`

### Health Checks

**Backend Health**: http://localhost:8000/health
```bash
curl http://localhost:8000/health
```

**Frontend Health**: http://localhost:3000
```bash
curl http://localhost:3000
```

**Database Health** (in Docker):
```bash
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"
```

### Logs and Monitoring

**View application logs**:
```bash
# Docker logs
docker-compose logs -f backend frontend

# Direct logs (development)
tail -f backend/logs/app.log
```

**Monitor metrics** (production):
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/your-password)

### Getting Help

1. Check the [troubleshooting section](docs/README.md#troubleshooting) in the docs
2. Search existing [GitHub issues](../../issues)
3. Create a new issue with:
   - System information (`python --version`, `node --version`, OS)
   - Error messages and logs
   - Steps to reproduce

### Security Checklist

For production deployments:
- [ ] Change all default passwords
- [ ] Use strong, unique secrets (32+ characters)
- [ ] Configure proper CORS origins
- [ ] Use trusted SSL certificates
- [ ] Enable firewall (only necessary ports)
- [ ] Regular security updates
- [ ] Monitor logs and metrics
- [ ] Test backup/restore procedures

## Next Steps

After setup:
1. Read the [full documentation](docs/README.md)
2. Explore the [API documentation](http://localhost:8000/docs)
3. Check out the [admin dashboard](http://localhost:3000/admin)
4. Set up monitoring and alerting
5. Plan your backup strategy

Need help? Check our [Contributing Guide](CONTRIBUTING.md) or create an issue!
