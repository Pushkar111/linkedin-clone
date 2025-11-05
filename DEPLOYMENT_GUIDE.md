# LinkedIn Clone - Deployment Guide

Complete guide for deploying the LinkedIn Clone application to production.

## 📋 Table of Contents

1. [Docker Deployment](#docker-deployment)
2. [Kubernetes Deployment](#kubernetes-deployment)
3. [Cloud Platform Deployment](#cloud-platform-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Post-Deployment Setup](#post-deployment-setup)

---

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# 1. Clone the repository
git clone https://github.com/Pushkar111/linkedin-demo.git
cd linkedin-demo

# 2. Create .env file
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# 3. Build and start all services
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Stop services
docker-compose down
```

**Services:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: localhost:27017

### Individual Container Deployment

#### Backend
```bash
cd backend

# Build image
docker build -t linkedin-backend:latest .

# Run container
docker run -d \
  --name linkedin-backend \
  -p 5000:5000 \
  --env-file .env \
  linkedin-backend:latest
```

#### Frontend
```bash
cd frontend-reference

# Build image with API URL
docker build \
  --build-arg REACT_APP_API_URL=http://localhost:5000 \
  -t linkedin-frontend:latest .

# Run container
docker run -d \
  --name linkedin-frontend \
  -p 3000:80 \
  linkedin-frontend:latest
```

#### MongoDB
```bash
docker run -d \
  --name linkedin-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
  -v mongodb_data:/data/db \
  mongo:latest
```

---

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (minikube, GKE, EKS, AKS)
- kubectl configured
- Docker images pushed to registry

### Step 1: Create Secrets

```bash
# Create secret for sensitive data
kubectl create secret generic linkedin-secrets \
  --from-literal=mongo-uri='your-mongodb-uri' \
  --from-literal=jwt-secret='your-jwt-secret' \
  --from-literal=cloudinary-cloud-name='your-cloud-name' \
  --from-literal=cloudinary-api-key='your-api-key' \
  --from-literal=cloudinary-api-secret='your-api-secret' \
  --from-literal=mongo-root-username='admin' \
  --from-literal=mongo-root-password='admin123'
```

### Step 2: Deploy MongoDB
```bash
kubectl apply -f kubernetes/mongodb-deployment.yml
```

### Step 3: Deploy Backend
```bash
kubectl apply -f kubernetes/backend-deployment.yml
```

### Step 4: Deploy Frontend
```bash
kubectl apply -f kubernetes/frontend-deployment.yml
```

### Step 5: Verify Deployment
```bash
# Check all resources
kubectl get all

# Check pods status
kubectl get pods

# Check services
kubectl get services

# View logs
kubectl logs -f deployment/linkedin-backend
kubectl logs -f deployment/linkedin-frontend
```

### Access Application
```bash
# Get LoadBalancer IPs
kubectl get svc linkedin-backend-service
kubectl get svc linkedin-frontend-service

# Or use port-forward for local testing
kubectl port-forward svc/linkedin-backend-service 5000:5000
kubectl port-forward svc/linkedin-frontend-service 3000:80
```

---

## ☁️ Cloud Platform Deployment

### Option 1: Vercel (Frontend) + Render (Backend)

#### Deploy Frontend to Vercel

1. **Push code to GitHub**
2. **Go to [Vercel](https://vercel.com)**
3. **Import project**
   - Select `linkedin-demo` repository
   - Root Directory: `frontend-reference`
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`

4. **Add Environment Variable:**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   ```

5. **Deploy**
   - URL will be: `https://your-project.vercel.app`

#### Deploy Backend to Render

1. **Go to [Render](https://render.com)**
2. **Create new Web Service**
3. **Connect GitHub repository**
4. **Configure:**
   - Name: `linkedin-clone-backend`
   - Root Directory: `backend`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

5. **Add Environment Variables:**
   ```
   NODE_ENV=production
   MONGO_URI=your-mongodb-atlas-uri
   JWT_SECRET=your-secret
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-key
   CLOUDINARY_API_SECRET=your-secret
   FRONTEND_URL=https://your-project.vercel.app
   ```

6. **Deploy**
   - URL will be: `https://linkedin-clone-backend.onrender.com`

7. **Update Vercel Environment:**
   - Go back to Vercel
   - Update `REACT_APP_API_URL` with Render backend URL
   - Redeploy frontend

---

### Option 2: AWS Deployment

#### Backend on AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
cd backend
eb init -p node.js linkedin-backend

# Create environment
eb create linkedin-backend-prod

# Deploy
eb deploy

# Set environment variables
eb setenv \
  NODE_ENV=production \
  MONGO_URI=your-mongodb-uri \
  JWT_SECRET=your-secret \
  CLOUDINARY_CLOUD_NAME=your-cloud \
  CLOUDINARY_API_KEY=your-key \
  CLOUDINARY_API_SECRET=your-secret

# Open application
eb open
```

#### Frontend on AWS S3 + CloudFront

```bash
cd frontend-reference

# Build production bundle
REACT_APP_API_URL=https://your-backend-url npm run build

# Create S3 bucket
aws s3 mb s3://linkedin-clone-frontend

# Enable static website hosting
aws s3 website s3://linkedin-clone-frontend \
  --index-document index.html \
  --error-document index.html

# Upload build files
aws s3 sync build/ s3://linkedin-clone-frontend --acl public-read

# Create CloudFront distribution (optional, for CDN)
aws cloudfront create-distribution \
  --origin-domain-name linkedin-clone-frontend.s3.amazonaws.com
```

---

### Option 3: Google Cloud Platform

#### Backend on Cloud Run

```bash
# Build and push Docker image
cd backend
gcloud builds submit --tag gcr.io/PROJECT_ID/linkedin-backend

# Deploy to Cloud Run
gcloud run deploy linkedin-backend \
  --image gcr.io/PROJECT_ID/linkedin-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,JWT_SECRET=your-secret
```

#### Frontend on Firebase Hosting

```bash
cd frontend-reference

# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init hosting

# Build production
REACT_APP_API_URL=https://your-backend-url npm run build

# Deploy
firebase deploy --only hosting
```

---

## 🔧 Environment Configuration

### Production Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/linkedin-clone?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-64-chars-recommended
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=LinkedIn Clone
```

#### Frontend (.env.production)
```env
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_SOCKET_URL=https://your-backend-domain.com
```

---

## ✅ Post-Deployment Setup

### 1. MongoDB Atlas Configuration

```bash
# 1. Create MongoDB Atlas account
# 2. Create cluster (free tier available)
# 3. Create database user
# 4. Whitelist IP addresses:
#    - 0.0.0.0/0 (all IPs) for cloud deployments
#    - Or specific IPs for security
# 5. Get connection string
# 6. Update MONGO_URI in backend environment
```

### 2. Cloudinary Setup

```bash
# 1. Create Cloudinary account
# 2. Go to Dashboard
# 3. Copy:
#    - Cloud Name
#    - API Key
#    - API Secret
# 4. Update environment variables
```

### 3. Google OAuth Setup

```bash
# 1. Go to Google Cloud Console
# 2. Create project
# 3. Enable Google+ API
# 4. Create OAuth 2.0 credentials
# 5. Add authorized redirect URIs:
#    - http://localhost:3000 (development)
#    - https://your-domain.com (production)
# 6. Copy Client ID and Secret
# 7. Update environment variables
```

### 4. SSL/HTTPS Configuration

#### For Custom Domain (Let's Encrypt)
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 5. Health Checks

```bash
# Backend health check
curl https://your-backend-url/health

# Expected response
{"success":true,"message":"Server is running","timestamp":"2025-11-06T..."}

# Frontend health check
curl https://your-frontend-url/health

# Expected response
healthy
```

### 6. Monitoring Setup

#### Backend Monitoring
```bash
# Install PM2 (if using VPS)
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name linkedin-backend

# Monitor
pm2 monit

# View logs
pm2 logs linkedin-backend
```

#### Application Monitoring (Optional)
- **New Relic** - APM monitoring
- **Datadog** - Infrastructure monitoring
- **Sentry** - Error tracking
- **LogRocket** - Frontend monitoring

### 7. Backup Configuration

```bash
# MongoDB backup script
mongodump --uri="your-mongodb-uri" --out=/backup/$(date +%Y%m%d)

# Automated backup (cron job)
0 2 * * * /usr/bin/mongodump --uri="your-mongodb-uri" --out=/backup/$(date +\%Y\%m\%d)
```

---

## 🔍 Troubleshooting

### Common Issues

#### CORS Errors
```env
# Update backend FRONTEND_URL to match deployed frontend
FRONTEND_URL=https://your-frontend-domain.com
```

#### Database Connection Failed
```bash
# Check MongoDB Atlas IP whitelist
# Verify connection string format
# Test connection:
mongosh "your-connection-string"
```

#### Image Upload Fails
```bash
# Verify Cloudinary credentials
# Check API key and secret
# Test upload manually
```

#### 502 Bad Gateway
```bash
# Check backend is running
# Verify port configuration
# Check firewall rules
```

---

## 📊 Performance Optimization

### CDN Setup
- Use CloudFront (AWS) or Cloudflare for static assets
- Enable gzip compression
- Configure caching headers

### Database Optimization
- Create indexes for frequently queried fields
- Use connection pooling
- Enable query caching

### Application Optimization
- Enable compression middleware
- Use Redis for session storage
- Implement rate limiting
- Optimize images through Cloudinary

---

## 🔒 Security Checklist

- [ ] All environment variables secured
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] MongoDB access restricted
- [ ] API keys rotated regularly
- [ ] Helmet security headers enabled
- [ ] Input validation implemented
- [ ] SQL/NoSQL injection protection
- [ ] XSS protection enabled

---

## 📞 Support

For deployment issues:
- Email: pushkarmodi111@gmail.com
- GitHub Issues: [linkedin-demo/issues](https://github.com/Pushkar111/linkedin-demo/issues)

---

**Happy Deploying! 🚀**
