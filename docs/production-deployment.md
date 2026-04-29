# Production Deployment Guide

## Overview

This document provides comprehensive guidance for deploying the Data Mining Platform to production environments. It covers infrastructure setup, deployment procedures, monitoring, maintenance, and troubleshooting.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Requirements](#infrastructure-requirements)
3. [Security Considerations](#security-considerations)
4. [Deployment Architecture](#deployment-architecture)
5. [Installation Steps](#installation-steps)
6. [Configuration](#configuration)
7. [SSL/TLS Setup](#ssltls-setup)
8. [Monitoring & Observability](#monitoring--observability)
9. [Backup & Recovery](#backup--recovery)
10. [Scaling & Performance](#scaling--performance)
11. [Maintenance](#maintenance)
12. [Troubleshooting](#troubleshooting)
13. [Disaster Recovery](#disaster-recovery)

## Prerequisites

### System Requirements

- **Operating System**: Ubuntu 20.04 LTS or later, CentOS 8+, or RHEL 8+
- **CPU**: Minimum 4 cores, recommended 8+ cores
- **RAM**: Minimum 8GB, recommended 16GB+
- **Storage**: Minimum 100GB SSD, recommended 500GB+ SSD
- **Network**: Stable internet connection for Docker image pulls

### Software Requirements

- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Git**: Latest version
- **curl**: For health checks
- **tar**: For backup operations

### Security Requirements

- **Firewall**: Configured to allow only necessary ports
- **SSH**: Key-based authentication only
- **SSL Certificate**: Valid SSL certificate for production domain
- **User Management**: Non-root user with sudo privileges

## Infrastructure Requirements

### Network Configuration

```bash
# Required ports
80    - HTTP (redirects to HTTPS)
443   - HTTPS (main application)
3000  - Frontend (internal)
8000  - Backend API (internal)
8001  - ML Engine (internal)
8002  - Crawling Service (internal)
5432  - PostgreSQL (internal)
6379  - Redis (internal)
9090  - Prometheus
3001  - Grafana
5601  - Kibana
9200  - Elasticsearch (internal)
```

### Storage Requirements

```bash
# Directory structure
/opt/data-mining-platform/          # Application root
/opt/backups/                       # Backup storage
/var/log/data-mining-platform/      # Application logs
/etc/nginx/ssl/                     # SSL certificates
```

### Resource Allocation

```yaml
# Recommended resource limits
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
  
  ml-engine:
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
        reservations:
          memory: 2G
          cpus: '1.0'
  
  crawling-service:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
```

## Security Considerations

### Network Security

- **Firewall Configuration**: Only expose necessary ports
- **VPN Access**: Use VPN for administrative access
- **Load Balancer**: Implement rate limiting and DDoS protection
- **WAF**: Consider Web Application Firewall for additional protection

### Application Security

- **Environment Variables**: Never commit secrets to version control
- **Secret Management**: Use Docker secrets or external secret management
- **Regular Updates**: Keep all images and dependencies updated
- **Security Scanning**: Regular vulnerability scans

### Data Security

- **Encryption at Rest**: Encrypt database and file storage
- **Encryption in Transit**: TLS 1.2+ for all communications
- **Access Control**: Implement role-based access control
- **Audit Logging**: Log all administrative actions

## Deployment Architecture

```
Internet
    │
    ▼
[Load Balancer / WAF]
    │
    ▼
[Nginx Reverse Proxy]
    │
    ├── Frontend (Next.js)
    ├── Backend API (FastAPI)
    ├── ML Engine Service
    └── Crawling Service
    │
    ▼
[Database Layer]
    ├── PostgreSQL (Primary)
    └── Redis (Cache/Sessions)
    │
    ▼
[Monitoring Stack]
    ├── Prometheus (Metrics)
    ├── Grafana (Visualization)
    ├── Elasticsearch (Logs)
    └── Kibana (Log Analysis)
```

## Installation Steps

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y docker.io docker-compose git curl tar

# Add user to docker group
sudo usermod -aG docker $USER

# Create application directory
sudo mkdir -p /opt/data-mining-platform
sudo chown $USER:$USER /opt/data-mining-platform

# Create backup and log directories
sudo mkdir -p /opt/backups /var/log/data-mining-platform
sudo chown $USER:$USER /opt/backups /var/log/data-mining-platform
```

### 2. Clone Repository

```bash
cd /opt/data-mining-platform
git clone https://github.com/your-org/data-mining-platform.git .
```

### 3. Environment Configuration

```bash
# Copy production environment file
cp config/production.env .env

# Edit environment variables
nano .env

# Generate secure secrets
openssl rand -hex 32  # For SECRET_KEY
openssl rand -hex 32  # For JWT_SECRET_KEY
```

### 4. SSL Certificate Setup

```bash
# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Copy your SSL certificates
sudo cp /path/to/your/cert.pem /etc/nginx/ssl/
sudo cp /path/to/your/key.pem /etc/nginx/ssl/

# Set proper permissions
sudo chmod 600 /etc/nginx/ssl/*
sudo chown root:root /etc/nginx/ssl/*
```

### 5. Initial Deployment

```bash
# Make deployment script executable
chmod +x scripts/deploy-production.sh

# Run initial deployment
./scripts/deploy-production.sh deploy
```

## Configuration

### Environment Variables

Key environment variables to configure:

```bash
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/database
POSTGRES_PASSWORD=secure_password

# Security
SECRET_KEY=your_secure_secret_key
JWT_SECRET_KEY=your_jwt_secret_key

# External Services
ML_ENGINE_URL=http://ml-engine:8000
CRAWLING_SERVICE_URL=http://crawling-service:3000

# Monitoring
GRAFANA_ADMIN_PASSWORD=secure_grafana_password
```

### Nginx Configuration

Customize Nginx configuration for your domain:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Your custom configuration here
}
```

### Database Configuration

PostgreSQL optimization for production:

```sql
-- Performance tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();
```

## SSL/TLS Setup

### Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Custom SSL Certificate

```bash
# Convert certificate formats if needed
openssl x509 -in certificate.crt -out cert.pem -outform PEM
openssl rsa -in private.key -out key.pem -outform PEM
```

## Monitoring & Observability

### Prometheus Configuration

```yaml
# Custom metrics to monitor
- job_name: 'custom-metrics'
  static_configs:
    - targets: ['backend:8000']
  metrics_path: '/metrics'
  scrape_interval: 30s
```

### Grafana Dashboards

Import pre-configured dashboards:

1. **System Overview**: Monitor system resources
2. **Application Metrics**: Track API performance
3. **Database Performance**: Monitor PostgreSQL metrics
4. **ML Engine Metrics**: Track ML processing performance

### Log Aggregation

Configure log shipping to Elasticsearch:

```yaml
# Filebeat configuration
filebeat.inputs:
- type: log
  paths:
    - /var/log/data-mining-platform/*.log
  fields:
    service: data-mining-platform
    environment: production
```

## Backup & Recovery

### Automated Backups

```bash
# Add to crontab
0 2 * * * /opt/data-mining-platform/scripts/deploy-production.sh backup
0 3 * * * /opt/data-mining-platform/scripts/deploy-production.sh cleanup
```

### Backup Verification

```bash
# Test backup restoration
./scripts/deploy-production.sh backup
# Verify backup files exist
ls -la /opt/backups/data-mining-platform/
```

### Recovery Procedures

```bash
# Stop current deployment
./scripts/deploy-production.sh stop

# Restore from backup
./scripts/deploy-production.sh rollback

# Verify recovery
./scripts/deploy-production.sh status
```

## Scaling & Performance

### Horizontal Scaling

```yaml
# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
docker-compose -f docker-compose.prod.yml up -d --scale ml-engine=2
```

### Load Balancing

Configure Nginx upstream for multiple instances:

```nginx
upstream backend_servers {
    least_conn;
    server backend:8000 max_fails=3 fail_timeout=30s;
    server backend:8001 max_fails=3 fail_timeout=30s;
    server backend:8002 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

### Performance Optimization

```bash
# Database optimization
CREATE INDEX CONCURRENTLY idx_dataset_created_at ON datasets(created_at);
VACUUM ANALYZE datasets;

# Redis optimization
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli CONFIG SET maxmemory 2gb
```

## Maintenance

### Regular Maintenance Tasks

```bash
# Weekly
./scripts/deploy-production.sh backup
docker system prune -f

# Monthly
docker image prune -a
docker volume prune

# Quarterly
Review and update SSL certificates
Update system packages
Review security configurations
```

### Update Procedures

```bash
# Pull latest changes
git pull origin main

# Update images
docker-compose -f docker-compose.prod.yml pull

# Restart services
./scripts/deploy-production.sh restart
```

### Health Checks

```bash
# Check service status
./scripts/deploy-production.sh status

# Monitor logs
docker-compose -f docker-compose.prod.yml logs -f

# Check metrics
curl http://localhost:9090/metrics
```

## Troubleshooting

### Common Issues

#### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs service_name

# Check resource usage
docker stats

# Verify configuration
docker-compose -f docker-compose.prod.yml config
```

#### Database Connection Issues

```bash
# Check PostgreSQL status
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Check connection from backend
docker-compose -f docker-compose.prod.yml exec backend python -c "
import psycopg2
conn = psycopg2.connect('postgresql://user:pass@postgres:5432/db')
print('Connection successful')
"
```

#### Performance Issues

```bash
# Check resource usage
docker stats --no-stream

# Monitor database performance
docker-compose -f docker-compose.prod.yml exec postgres psql -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
"
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
docker-compose -f docker-compose.prod.yml restart backend

# Check detailed logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100 backend
```

## Disaster Recovery

### Recovery Procedures

1. **Service Failure**: Automatic restart with health checks
2. **Database Corruption**: Restore from latest backup
3. **Complete System Failure**: Full system restore procedure
4. **Data Loss**: Point-in-time recovery from backups

### Recovery Time Objectives

- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour
- **Backup Retention**: 30 days
- **Testing Frequency**: Monthly recovery drills

### Emergency Contacts

- **System Administrator**: [Contact Info]
- **Database Administrator**: [Contact Info]
- **Security Team**: [Contact Info]
- **Vendor Support**: [Contact Info]

## Support & Resources

### Documentation

- [Architecture Documentation](./architecture.md)
- [Development Guide](./development-guide.md)
- [API Documentation](./api-documentation.md)

### Monitoring URLs

- **Grafana**: http://yourdomain.com:3001
- **Prometheus**: http://yourdomain.com:9090
- **Kibana**: http://yourdomain.com:5601

### Contact Information

For production deployment support, contact:
- **Email**: devops@yourcompany.com
- **Slack**: #devops-support
- **Emergency**: [Emergency Contact]

---

**Last Updated**: $(date +%Y-%m-%d)
**Version**: 1.0.0
**Maintainer**: DevOps Team
