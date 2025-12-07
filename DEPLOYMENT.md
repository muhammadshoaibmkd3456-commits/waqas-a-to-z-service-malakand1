# Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- AWS account (or GCP/Azure)
- Docker & Kubernetes (or Docker Swarm)
- Domain name with DNS access
- SSL certificate (Let's Encrypt)
- CI/CD pipeline (GitHub Actions, GitLab CI)

## 📦 Docker Deployment

### Build Image
```bash
docker build -t a-to-z-backend:1.0.0 .
docker tag a-to-z-backend:1.0.0 your-registry/a-to-z-backend:1.0.0
docker push your-registry/a-to-z-backend:1.0.0
```

### Environment Setup
```bash
# Create .env.production
NODE_ENV=production
PORT=3001
JWT_SECRET=<generate-strong-secret>
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_USER=<secure-user>
DB_PASSWORD=<secure-password>
DB_NAME=a_to_z_db
DB_SSL=true
REDIS_HOST=<elasticache-endpoint>
REDIS_PORT=6379
REDIS_PASSWORD=<secure-password>
```

## ☸️ Kubernetes Deployment

### Deployment Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: a-to-z-backend
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: a-to-z-backend
  template:
    metadata:
      labels:
        app: a-to-z-backend
    spec:
      containers:
      - name: backend
        image: your-registry/a-to-z-backend:1.0.0
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: host
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: a-to-z-backend-service
  namespace: production
spec:
  selector:
    app: a-to-z-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: LoadBalancer
```

### Deploy to Kubernetes
```bash
kubectl apply -f deployment.yaml
kubectl rollout status deployment/a-to-z-backend -n production
```

## 🗄️ Database Setup

### AWS RDS PostgreSQL
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier a-to-z-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username postgres \
  --master-user-password <strong-password> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --backup-retention-period 30 \
  --multi-az \
  --enable-iam-database-authentication
```

### Database Initialization
```bash
# Connect to RDS
psql -h <rds-endpoint> -U postgres -d a_to_z_db

# Run initialization script
\i scripts/init.sql

# Run migrations
npm run migration:run
```

## 💾 Redis Setup

### AWS ElastiCache
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id a-to-z-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --port 6379 \
  --parameter-group-name default.redis7
```

## 🔐 SSL/TLS Certificate

### Let's Encrypt with Certbot
```bash
sudo certbot certonly --standalone \
  -d api.example.com \
  -d admin.example.com
```

### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name api.example.com;
    return 301 https://$server_name$request_uri;
}
```

## 📊 Monitoring & Logging

### Prometheus Setup
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'a-to-z-backend'
    static_configs:
      - targets: ['localhost:3001']
```

### Grafana Dashboard
- Import dashboard ID: 11074 (Node.js Application)
- Configure data source: Prometheus
- Add custom panels for business metrics

### ELK Stack (Elasticsearch, Logstash, Kibana)
```bash
# Logstash configuration
input {
  tcp {
    port => 5000
    codec => json
  }
}

filter {
  if [type] == "nodejs" {
    mutate {
      add_field => { "[@metadata][index_name]" => "nodejs-%{+YYYY.MM.dd}" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "%{[@metadata][index_name]}"
  }
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t a-to-z-backend:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag a-to-z-backend:${{ github.sha }} your-registry/a-to-z-backend:latest
          docker push your-registry/a-to-z-backend:latest
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/a-to-z-backend \
            backend=your-registry/a-to-z-backend:latest \
            -n production
          kubectl rollout status deployment/a-to-z-backend -n production
```

## 🔄 Backup & Disaster Recovery

### Automated Backups
```bash
# RDS automated backups (7-day retention)
aws rds modify-db-instance \
  --db-instance-identifier a-to-z-db \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00"
```

### Manual Backup
```bash
# Create RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier a-to-z-db \
  --db-snapshot-identifier a-to-z-db-backup-$(date +%Y%m%d)
```

### Restore from Backup
```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier a-to-z-db-restored \
  --db-snapshot-identifier a-to-z-db-backup-20240101
```

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale Kubernetes deployment
kubectl scale deployment a-to-z-backend --replicas=5 -n production
```

### Auto-scaling
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: a-to-z-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: a-to-z-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] Database initialized and migrated
- [ ] Redis cache configured
- [ ] SSL certificate installed
- [ ] Firewall rules configured
- [ ] WAF enabled
- [ ] Monitoring & logging setup
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan tested
- [ ] Load balancer configured
- [ ] Auto-scaling configured
- [ ] Health checks enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers enabled

## 🚨 Rollback Procedure

```bash
# Kubernetes rollback
kubectl rollout undo deployment/a-to-z-backend -n production

# Docker rollback
docker run -d -p 3001:3001 your-registry/a-to-z-backend:previous-version
```

## 📞 Support

For deployment issues, contact DevOps team or check logs:
```bash
kubectl logs -f deployment/a-to-z-backend -n production
```

---

**Last Updated**: December 2024
