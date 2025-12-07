# 🚀 Deploy to Render.com - Quick Guide

## ✅ Your Backend is Ready!

- ✅ Built successfully (0 errors)
- ✅ Database configured (Neon PostgreSQL)
- ✅ Environment variables ready
- ✅ Ready to deploy

---

## 🎯 Deployment Steps (5 minutes)

### **Step 1: Go to Render.com**
https://render.com

### **Step 2: Sign Up or Login**
- Click "Sign Up"
- Use GitHub, Google, or email
- Verify email

### **Step 3: Create Web Service**
1. Click "New +" button
2. Select "Web Service"
3. Choose deployment method:
   - **Option A**: "Connect GitHub" (if you have Git)
   - **Option B**: "Paste a public Git repository URL"
   - **Option C**: "Upload code"

### **Step 4: Configure Service**

**Name**: `a-to-z-backend`

**Environment**: `Node`

**Region**: `Ohio` (or closest to you)

**Build Command**:
```
npm install --legacy-peer-deps && npm run build
```

**Start Command**:
```
node dist/main.js
```

**Plan**: `Free` (or `Starter` for always-on)

### **Step 5: Add Environment Variables**

Click "Environment" and add these:

```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-ultra-secure-jwt-secret-key-min-32-chars-change-this
DB_HOST=ep-small-queen-aelc6166-pooler.c-2.us-east-2.aws.neon.tech
DB_PORT=5432
DB_USER=neondb_owner
DB_PASSWORD=npg_nTb2ApgBJs5k
DB_NAME=Aneesa
DB_SSL=true
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
CORS_ORIGIN=https://waqas-a-to-z-service-malakand.netlify.app
```

### **Step 6: Deploy**

Click "Create Web Service"

Wait 3-5 minutes for deployment...

### **Step 7: Get Your URL**

After deployment, Render shows your URL:
```
https://a-to-z-backend.onrender.com
```

### **Step 8: Test**

```
https://a-to-z-backend.onrender.com/health
https://a-to-z-backend.onrender.com/api/docs
```

---

## 📋 Before You Deploy

**You need:**
1. ✅ Render.com account (free)
2. ✅ Redis instance (Upstash: https://upstash.com)
3. ✅ Environment variables (see above)

**Redis Setup** (3 minutes):
1. Go to https://upstash.com
2. Sign up (free)
3. Create Redis database
4. Copy: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD

---

## 🎉 Done!

Your backend will be live at:
```
https://a-to-z-backend.onrender.com
```

**API Documentation**:
```
https://a-to-z-backend.onrender.com/api/docs
```

---

**Status**: ✅ READY TO DEPLOY
**Time**: 5-10 minutes
**Cost**: Free tier available
