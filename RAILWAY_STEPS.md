# 🚀 Railway.app Deployment - Step by Step

## Prerequisites
- ✅ Node.js 20+ (Installed)
- ✅ npm 10+ (Installed)
- ✅ Railway CLI 4.12.0+ (Installed)
- 📝 Railway.app account (Create at https://railway.app)

---

## 📋 Complete Deployment Steps

### **Step 1: Create Railway Account** (If you don't have one)

1. Go to https://railway.app
2. Click "Sign Up"
3. Choose sign-up method:
   - GitHub
   - Google
   - Email
4. Verify your email
5. Create your first project

---

### **Step 2: Login to Railway CLI**

```powershell
railway login
```

**What happens:**
- Browser window opens automatically
- Click "Authorize" to authorize the CLI
- Return to terminal (it will confirm login)

**Expected output:**
```
✓ Logged in successfully
```

---

### **Step 3: Initialize Railway Project**

```powershell
cd c:\Users\Waqas\Desktop\Waqas A to Z services\backend
railway init
```

**When prompted:**
- **Project name**: `a-to-z-backend`
- **Environment**: `production`

**Expected output:**
```
✓ Project initialized
✓ Environment created
```

---

### **Step 4: Add PostgreSQL Database**

```powershell
railway add
```

**When prompted:**
- Select: **PostgreSQL**
- Confirm: Yes

**What Railway does:**
- Creates PostgreSQL instance
- Sets environment variables automatically:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`

---

### **Step 5: Add Redis Cache**

```powershell
railway add
```

**When prompted:**
- Select: **Redis**
- Confirm: Yes

**What Railway does:**
- Creates Redis instance
- Sets environment variables automatically:
  - `REDIS_HOST`
  - `REDIS_PORT`
  - `REDIS_PASSWORD`

---

### **Step 6: Set Application Environment Variables**

```powershell
railway variables
```

**Add these variables:**

```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-ultra-secure-jwt-secret-key-min-32-chars-change-this
CORS_ORIGIN=https://waqas-a-to-z-service-malakand.netlify.app
```

**Optional (if you have these services):**
```
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@your-domain.com
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
STRIPE_SECRET_KEY=your-stripe-key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket
```

---

### **Step 7: Deploy to Railway**

```powershell
railway up
```

**What happens:**
1. Builds your application
2. Runs migrations
3. Deploys to Railway
4. Shows deployment URL

**Expected output:**
```
✓ Building application...
✓ Running migrations...
✓ Deploying...
✓ Deployment successful!
✓ Your app is live at: https://a-to-z-backend-prod.railway.app
```

**This takes 2-5 minutes**

---

### **Step 8: Verify Deployment**

```powershell
# Check deployment status
railway status

# View logs
railway logs

# Open in browser
railway open
```

---

### **Step 9: Test Your API**

**Health Check:**
```powershell
curl https://your-app-name.railway.app/health
```

**API Documentation:**
Open in browser:
```
https://your-app-name.railway.app/api/docs
```

**Test Registration:**
```powershell
curl -X POST https://your-app-name.railway.app/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

---

## 🔄 Redeployment (After Code Changes)

```powershell
# Build locally
npm run build

# Deploy
railway up
```

---

## 📊 Monitor Your Deployment

```powershell
# View real-time logs
railway logs --follow

# View deployment history
railway deployments

# View environment variables
railway variables

# View service status
railway status
```

---

## 🆘 Troubleshooting

### Issue: "Unauthorized. Please login"
```powershell
railway login
```

### Issue: "Build failed"
```powershell
# Check logs
railway logs

# Rebuild locally
npm run build

# Redeploy
railway up
```

### Issue: "Database connection error"
- Check environment variables: `railway variables`
- Verify DB_HOST, DB_USER, DB_PASSWORD are correct
- Ensure PostgreSQL service is running

### Issue: "CORS error from frontend"
```powershell
# Update CORS_ORIGIN
railway variables

# Add your frontend URL to CORS_ORIGIN
# Redeploy
railway up
```

### Issue: "Out of memory"
- Railway free tier has 512MB RAM
- Optimize database queries
- Upgrade to paid plan if needed

---

## 💰 Pricing

**Railway.app Free Tier:**
- $5 free credits per month
- PostgreSQL: Included
- Redis: Included
- Enough for development/testing

**Paid Plans:**
- Pay-as-you-go after free credits
- Typical production: $10-50/month

---

## 📞 Support

- Railway Docs: https://docs.railway.app
- Railway Support: https://railway.app/support
- Check logs: `railway logs`
- Community: https://discord.gg/railway

---

## ✅ Deployment Checklist

- [ ] Railway account created
- [ ] Railway CLI installed
- [ ] Logged in: `railway login`
- [ ] Project initialized: `railway init`
- [ ] PostgreSQL added: `railway add`
- [ ] Redis added: `railway add`
- [ ] Environment variables set: `railway variables`
- [ ] Deployed: `railway up`
- [ ] Health check passed: `curl /health`
- [ ] API docs accessible: `/api/docs`
- [ ] Frontend CORS configured

---

## 🎉 Success!

Your backend is now deployed on Railway.app!

**Your API URL:** `https://your-app-name.railway.app`

**API Documentation:** `https://your-app-name.railway.app/api/docs`

**Frontend:** https://waqas-a-to-z-service-malakand.netlify.app/

---

**Status**: ✅ Ready to Deploy
**Estimated Time**: 15-20 minutes
**Cost**: Free tier available
