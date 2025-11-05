# LinkedIn Clone - Vercel + Render Deployment Guide

Complete step-by-step guide for deploying your LinkedIn Clone to Vercel (Frontend) and Render (Backend).

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ GitHub account with your code pushed
- ✅ Vercel account (sign up at [vercel.com](https://vercel.com))
- ✅ Render account (sign up at [render.com](https://render.com))
- ✅ MongoDB Atlas account (sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas))
- ✅ Cloudinary account (sign up at [cloudinary.com](https://cloudinary.com))

---

## Part 1: Setup MongoDB Atlas (Database)

### Step 1: Create MongoDB Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click **"Build a Database"**
3. Choose **FREE** tier (M0 Sandbox)
4. Select your preferred region (closest to your users)
5. Click **"Create Cluster"** (takes 3-5 minutes)

### Step 2: Create Database User

1. Go to **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `linkedin-user`
5. Password: Generate strong password (save it!)
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### Step 3: Whitelist IP Addresses

1. Go to **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for cloud deployments)
4. IP: `0.0.0.0/0`
5. Click **"Confirm"**

### Step 4: Get Connection String

1. Go to **"Database"** in left sidebar
2. Click **"Connect"** on your cluster
3. Click **"Connect your application"**
4. Copy the connection string:
   ```
   mongodb+srv://linkedin-user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add database name at the end:
   ```
   mongodb+srv://linkedin-user:YourPassword@cluster0.xxxxx.mongodb.net/linkedin-clone?retryWrites=true&w=majority
   ```
7. **Save this connection string!** You'll need it for Render.

---

## Part 2: Setup Cloudinary (Image Storage)

### Step 1: Create Account & Get Credentials

1. Go to [Cloudinary](https://cloudinary.com/users/register/free)
2. Sign up for free account
3. Go to **Dashboard**
4. Copy these values:
   - **Cloud Name**: `your-cloud-name`
   - **API Key**: `123456789012345`
   - **API Secret**: `abcdefghijklmnopqrstuvwxyz123`
5. **Save these!** You'll need them for Render.

---

## Part 3: Deploy Backend to Render

### Step 1: Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account (if not already connected)
4. Select your repository: `linkedin-demo`
5. Click **"Connect"**

### Step 2: Configure Service

Fill in these settings:

**Basic Settings:**
- **Name:** `linkedin-backend`
- **Region:** `Oregon (US West)` (or closest to you)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### Step 3: Choose Plan

- Select **"Free"** plan
- Click **"Advanced"** to add environment variables

### Step 4: Add Environment Variables

Click **"Add Environment Variable"** for each:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `5000` | |
| `MONGO_URI` | `mongodb+srv://...` | Your MongoDB connection string from Part 1 |
| `JWT_SECRET` | `your-super-secret-jwt-key-min-32-chars` | Generate random string |
| `JWT_EXPIRE` | `10d` | |
| `JWT_REFRESH_EXPIRE` | `30d` | |
| `CLOUDINARY_CLOUD_NAME` | `your-cloud-name` | From Part 2 |
| `CLOUDINARY_API_KEY` | `123456789012345` | From Part 2 |
| `CLOUDINARY_API_SECRET` | `abcdefgh...` | From Part 2 |
| `FRONTEND_URL` | `https://your-frontend-url.vercel.app` | Leave blank for now, update after Vercel |
| `RATE_LIMIT_WINDOW_MS` | `900000` | |
| `RATE_LIMIT_MAX_REQUESTS` | `200` | |
| `GOOGLE_CLIENT_ID` | `your-google-client-id` | Optional |
| `GOOGLE_CLIENT_SECRET` | `your-google-secret` | Optional |
| `EMAIL_USER` | `your-email@gmail.com` | Optional |
| `EMAIL_PASSWORD` | `your-app-password` | Optional |

**To generate JWT_SECRET:**
```bash
# On Mac/Linux
openssl rand -base64 64

# On Windows PowerShell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))

# Or use any random string generator
# Example: Kj8mN2pQ9rT3vX6yB7cF4gH5jK8lM1nP0qR2sT4uV6wX8yZ1aB3cD5eF7gH9
```

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. You'll see build logs in real-time
4. Once deployed, you'll get a URL like:
   ```
   https://linkedin-backend.onrender.com
   ```
5. **Copy this URL!** You'll need it for Vercel.

### Step 6: Verify Backend

Test your backend:
```bash
# Health check
curl https://linkedin-backend.onrender.com/health

# Should return:
{"success":true,"message":"Server is running","timestamp":"..."}
```

---

## Part 4: Deploy Frontend to Vercel

### Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

Or use the Vercel Dashboard (recommended for first time).

### Step 2: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. **Import Git Repository**
   - Click **"Import"** next to your `linkedin-demo` repo
   - If not showing, click **"Adjust GitHub App Permissions"**

### Step 3: Configure Project

**Framework Preset:**
- Vercel will auto-detect: **"Create React App"** ✅

**Root Directory:**
- Click **"Edit"**
- Select: `frontend-reference`
- Click **"Continue"**

**Build Settings:**
- Build Command: `npm run build` (auto-filled)
- Output Directory: `build` (auto-filled)
- Install Command: `npm install` (auto-filled)

### Step 4: Add Environment Variable

Click **"Environment Variables"**:

| Name | Value |
|------|-------|
| `REACT_APP_API_URL` | `https://linkedin-backend.onrender.com` |

**Important:** Use your actual Render backend URL from Part 3!

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. You'll get a URL like:
   ```
   https://linkedin-demo-xyz123.vercel.app
   ```
4. **Copy this URL!**

### Step 6: Update Backend CORS

1. Go back to **Render Dashboard**
2. Select your `linkedin-backend` service
3. Go to **"Environment"** tab
4. Find `FRONTEND_URL` variable
5. Update value to your Vercel URL:
   ```
   https://linkedin-demo-xyz123.vercel.app
   ```
6. Click **"Save Changes"**
7. Service will automatically redeploy (wait 1-2 minutes)

---

## Part 5: Verify Deployment

### Test Frontend

1. Open your Vercel URL in browser
2. You should see the LinkedIn Clone homepage
3. Try to sign up/login
4. Test creating a post
5. Check if images upload

### Test Backend API

```bash
# Health check
curl https://your-backend.onrender.com/health

# Get posts
curl https://your-backend.onrender.com/api/posts

# Register user
curl -X POST https://your-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","fullName":"Test User"}'
```

---

## Part 6: Custom Domain (Optional)

### Add Custom Domain to Vercel

1. In Vercel Dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Enter your domain: `linkedin.yourdomain.com`
4. Add DNS records as instructed by Vercel
5. Wait for DNS propagation (5-60 minutes)

### Add Custom Domain to Render

1. In Render Dashboard, select your backend service
2. Click **"Settings"** → **"Custom Domain"**
3. Enter: `api.yourdomain.com`
4. Add CNAME record as instructed
5. Wait for verification

### Update Environment Variables

Update `FRONTEND_URL` in Render with your custom domain.

---

## 🔧 Configuration Files Reference

### render.yaml (Backend)
Located at: `backend/render.yaml`

This file is used when deploying via Render Blueprint. You can also deploy manually through the dashboard (recommended for first time).

### vercel.json (Frontend)
Located at: `frontend-reference/vercel.json`

Handles routing for React Router and static asset caching.

---

## 🐛 Troubleshooting

### Backend Issues

**Build Failed:**
```bash
# Check Node version in Render
# Ensure package.json has:
"engines": {
  "node": "18.x"
}
```

**Database Connection Error:**
- Verify MongoDB URI is correct
- Check network access in Atlas (0.0.0.0/0)
- Ensure password has no special characters (or URL encode them)

**Environment Variables Not Working:**
- Ensure no extra spaces in values
- Restart service after adding variables
- Check logs: Render Dashboard → Logs

### Frontend Issues

**API Calls Failing:**
- Check REACT_APP_API_URL is correct
- Ensure it starts with https://
- No trailing slash
- Redeploy after changing env vars

**CORS Errors:**
- Ensure FRONTEND_URL in backend matches Vercel URL exactly
- Include https://
- No trailing slash
- Wait for backend to redeploy

**Build Failed:**
- Check build logs in Vercel
- Ensure all dependencies are in package.json
- Try local build: `npm run build`

### Image Upload Issues

- Verify Cloudinary credentials
- Check CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET
- Test upload manually in Cloudinary dashboard

---

## 💰 Free Tier Limits

### Render Free Tier
- ✅ 750 hours/month (enough for 1 service running 24/7)
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Cold starts take 30-50 seconds
- ✅ Automatic SSL
- ✅ 1 free instance

### Vercel Free Tier
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic SSL
- ✅ Global CDN
- ✅ No cold starts

### MongoDB Atlas Free Tier
- ✅ 512MB storage
- ✅ Shared cluster
- ✅ Enough for 1000s of users

### Cloudinary Free Tier
- ✅ 25GB storage
- ✅ 25GB bandwidth/month
- ✅ Enough for 10,000s of images

---

## 🚀 Your Live URLs

After deployment, you'll have:

```
Frontend:  https://linkedin-demo-xyz123.vercel.app
Backend:   https://linkedin-backend.onrender.com
Database:  MongoDB Atlas (cloud)
Images:    Cloudinary (cloud)
```

---

## 📝 Submission Template

```
LinkedIn Clone - Live Application

🌐 Frontend URL: https://linkedin-demo-xyz123.vercel.app
🔧 Backend URL:  https://linkedin-backend.onrender.com
📊 GitHub Repo:  https://github.com/Pushkar111/linkedin-demo

Deployment:
✅ Frontend: Vercel (Global CDN)
✅ Backend: Render (Oregon, US)
✅ Database: MongoDB Atlas
✅ Storage: Cloudinary

Test Credentials:
Email: demo@linkedin.com
Password: demo123

All services are running on free tiers.
```

---

## 🎉 Congratulations!

Your LinkedIn Clone is now live and accessible worldwide! 🌍

**What's Working:**
- ✅ User registration & login
- ✅ Post creation with images
- ✅ Like & comment system
- ✅ User profiles
- ✅ Real-time features
- ✅ Responsive design

**Share your URLs with:**
- Your Tech Lead
- AppDost HR
- Your portfolio
- LinkedIn profile
- Resume

---

## 🔄 Redeployment

### Update Backend
1. Push changes to GitHub
2. Render auto-deploys from main branch
3. Or click "Manual Deploy" in Render Dashboard

### Update Frontend
1. Push changes to GitHub
2. Vercel auto-deploys from main branch
3. Or run: `vercel --prod`

---

## 📞 Support

Issues? Check:
1. Render logs: Dashboard → Logs
2. Vercel logs: Dashboard → Deployments → View Logs
3. Browser console for frontend errors
4. Network tab for API call errors

---

**Your app is live! Share it with the world!** 🚀✨
