import DocsLayout from '@/components/DocsLayout';

export default function DeploymentDocsPage() {
  return (
    <DocsLayout
      title="Deployment"
      description="Production deployment guide for TrueFace with Docker, security, and monitoring"
    >
      <div className="docs-content max-w-none">
        <h2>Overview</h2>
        <p>
          This guide covers deploying TrueFace to production using Docker Compose with proper
          security, SSL, monitoring, and backup strategies.
        </p>

        <h2>Prerequisites</h2>
        <ul>
          <li>Docker and Docker Compose installed</li>
          <li>Domain name with DNS configured</li>
          <li>SSL certificate (Let's Encrypt recommended)</li>
          <li>MongoDB instance (local or cloud)</li>
          <li>Basic Linux server administration knowledge</li>
        </ul>

        <h2>Quick Production Setup</h2>
        <p>The fastest way to deploy TrueFace to production:</p>

        <h3>1. Clone and Setup</h3>
        <pre><code>git clone https://github.com/yourusername/TrueFace.git
cd TrueFace
cp .env.example .env.production</code></pre>

        <h3>2. Configure Environment</h3>
        <p>Edit <code>.env.production</code> with your production values:</p>
        <pre><code># Database
MONGO_URI=mongodb://localhost:27017/trueface_production

# Security
JWT_SECRET=your-super-secure-secret-key-here
SESSION_EXPIRES_MINUTES=60

# Domain
DOMAIN=your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com

# Optional: Monitoring
METRICS_ENABLED=true
LOG_LEVEL=info</code></pre>

        <h3>3. Generate SSL Certificates</h3>
        <pre><code># Create SSL directory
mkdir -p nginx/ssl

# Option A: Let's Encrypt (Recommended)
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/private.key

# Option B: Self-signed (Development only)
openssl req -x509 -newkey rsa:2048 -keyout nginx/ssl/private.key \
  -out nginx/ssl/cert.pem -days 365 -nodes \
  -subj "/CN=your-domain.com"</code></pre>

        <h3>4. Deploy Services</h3>
        <pre><code># Start the complete stack
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f</code></pre>

        <h3>5. Verify Deployment</h3>
        <pre><code># Health checks
curl https://your-domain.com/health
curl https://your-domain.com/api/health

# Metrics (if enabled)
curl https://your-domain.com/metrics</code></pre>

        <h2>Docker Compose Configuration</h2>
        <p>The production <code>docker-compose.prod.yml</code> includes:</p>
        <ul>
          <li>Nginx reverse proxy with SSL termination</li>
          <li>Backend API with production optimizations</li>
          <li>Frontend with static file serving</li>
          <li>MongoDB with persistent storage</li>
          <li>Redis for caching and sessions</li>
          <li>Monitoring with Prometheus and Grafana</li>
        </ul>

        <h2>Cloud Platform Deployments</h2>

        <h3>AWS Deployment</h3>
        <p>Deploy TrueFace on AWS using ECS, RDS, and ElastiCache:</p>

        <h4>Infrastructure Setup</h4>
        <pre><code># Using AWS CLI
# 1. Create ECS cluster
aws ecs create-cluster --cluster-name trueface-production

# 2. Set up DocumentDB (MongoDB-compatible)
aws docdb create-db-cluster \
  --db-cluster-identifier trueface-db \
  --engine docdb \
  --master-username admin \
  --master-user-password YourSecurePassword

# 3. Create ElastiCache Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id trueface-redis \
  --engine redis \
  --cache-node-type cache.t3.micro</code></pre>

        <h4>Container Registry</h4>
        <pre><code># Build and push to ECR
aws ecr create-repository --repository-name trueface-backend
aws ecr create-repository --repository-name trueface-frontend

# Build and push images
docker build -f backend/Dockerfile.prod -t trueface-backend:latest backend/
docker build -f frontend/Dockerfile.prod -t trueface-frontend:latest frontend/

docker tag trueface-backend:latest your-account.dkr.ecr.region.amazonaws.com/trueface-backend:latest
docker push your-account.dkr.ecr.region.amazonaws.com/trueface-backend:latest</code></pre>

        <h3>Google Cloud Deployment</h3>
        <p>Deploy using Cloud Run, Cloud SQL, and Memorystore:</p>
        <pre><code># Build and push images
gcloud builds submit --tag gcr.io/PROJECT-ID/trueface-backend backend/
gcloud builds submit --tag gcr.io/PROJECT-ID/trueface-frontend frontend/

# Deploy backend service
gcloud run deploy trueface-backend \
  --image gcr.io/PROJECT-ID/trueface-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars="MONGO_URI=mongodb://...,REDIS_URL=redis://..."

# Deploy frontend service
gcloud run deploy trueface-frontend \
  --image gcr.io/PROJECT-ID/trueface-frontend \
  --platform managed \
  --region us-central1</code></pre>

        <h3>Azure Deployment</h3>
        <p>Using Azure Container Instances and Azure Database:</p>
        <pre><code># Create resource group
az group create --name TrueFaceRG --location eastus

# Deploy using ARM template
az deployment group create \
  --resource-group TrueFaceRG \
  --template-file azure-template.json \
  --parameters @azure-parameters.json</code></pre>

        <h2>Kubernetes Deployment</h2>
        <p>For large-scale deployments, use Kubernetes with Helm charts:</p>

        <h3>Backend Deployment</h3>
        <pre><code># k8s/backend-deployment.yaml
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
        image: trueface-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: trueface-secrets
              key: mongo-uri</code></pre>

        <h3>Service and Ingress</h3>
        <pre><code># Deploy to Kubernetes
kubectl apply -f k8s/
kubectl get pods
kubectl get services

# Check ingress
kubectl describe ingress trueface-ingress</code></pre>

        <h2>Security Hardening</h2>

        <h3>Environment Security</h3>
        <ul>
          <li>Use strong, unique secrets for JWT_SECRET</li>
          <li>Enable rate limiting in production</li>
          <li>Configure firewall rules (only 80, 443, 22 open)</li>
          <li>Disable root SSH access</li>
          <li>Keep system packages updated</li>
        </ul>

        <h3>Application Security</h3>
        <pre><code># Enable security features
RATE_LIMIT_ENABLED=true
RATE_LIMIT_AUTH=5/minute
RATE_LIMIT_UPLOAD=3/minute

# HTTPS enforcement
FORCE_HTTPS=true
HSTS_MAX_AGE=31536000</code></pre>

        <h3>Database Security</h3>
        <pre><code>{`# MongoDB security
# Enable authentication
mongo
use admin
db.createUser({
  user: "truefaceAdmin",
  pwd: "strongPassword",
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }]
})

# Update connection string
MONGO_URI=mongodb://truefaceAdmin:strongPassword@localhost:27017/trueface_production`}</code></pre>

        <h2>Monitoring and Logging</h2>

        <h3>Prometheus Metrics</h3>
        <p>TrueFace exposes metrics at <code>/metrics</code> for monitoring:</p>
        <ul>
          <li>HTTP request rates and latencies</li>
          <li>Authentication success/failure rates</li>
          <li>Face recognition confidence scores</li>
          <li>Database connection status</li>
          <li>System resource usage</li>
        </ul>

        <h3>Grafana Dashboard</h3>
        <p>Import the provided dashboard at <code>monitoring/grafana-dashboard.json</code></p>

        <h3>Log Management</h3>
        <pre><code># Centralized logging
docker-compose logs -f backend &gt; /var/log/trueface/backend.log
docker-compose logs -f frontend &gt; /var/log/trueface/frontend.log

# Log rotation
sudo nano /etc/logrotate.d/trueface</code></pre>

        <h2>Backup and Recovery</h2>

        <h3>Database Backup</h3>
        <pre><code># MongoDB backup
mongodump --host localhost --port 27017 --db trueface_production --out /backup/$(date +%Y%m%d)

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backup/mongodb/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
mongodump --host localhost --port 27017 --db trueface_production --out $BACKUP_DIR
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR</code></pre>

        <h3>Restore from Backup</h3>
        <pre><code># Restore database
mongorestore --host localhost --port 27017 --db trueface_production /backup/20250128/trueface_production</code></pre>

        <h2>Scaling Considerations</h2>

        <h3>Horizontal Scaling</h3>
        <ul>
          <li>Load balance multiple backend instances</li>
          <li>Use Redis for shared session storage</li>
          <li>Configure MongoDB replica sets</li>
          <li>Implement CDN for static assets</li>
        </ul>

        <h3>Performance Optimization</h3>
        <ul>
          <li>Enable MongoDB indexes for frequently queried fields</li>
          <li>Use Redis caching for face recognition results</li>
          <li>Optimize Docker images with multi-stage builds</li>
          <li>Configure nginx gzip compression</li>
        </ul>

        <h2>Troubleshooting Production Issues</h2>

        <h3>Common Problems</h3>
        <ul>
          <li><strong>SSL Certificate Issues</strong>: Check certificate validity and renewal</li>
          <li><strong>Database Connections</strong>: Verify MongoDB is running and accessible</li>
          <li><strong>Memory Issues</strong>: Monitor container resource usage</li>
          <li><strong>Rate Limiting</strong>: Adjust limits based on traffic patterns</li>
        </ul>

        <h3>Debug Commands</h3>
        <pre><code># Check container status
docker-compose ps

# View live logs
docker-compose logs -f backend

# Check resource usage
docker stats

# Test SSL certificate
openssl s_client -connect your-domain.com:443

# Check disk space
df -h</code></pre>

        <h2>Maintenance Tasks</h2>
        <ul>
          <li>Regular security updates for base images</li>
          <li>SSL certificate renewal (automated with Let's Encrypt)</li>
          <li>Database backup verification</li>
          <li>Log rotation and cleanup</li>
          <li>Performance monitoring review</li>
        </ul>
      </div>
    </DocsLayout>
  );
}
