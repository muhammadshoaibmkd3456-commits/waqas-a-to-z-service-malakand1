# ⚡ Quick Deploy to Railway.app (5 Minutes)

## Step-by-Step Instructions

### 1️⃣ Create Railway Account
- Go to https://railway.app
- Click "Sign Up"
- Sign up with GitHub, Google, or email
- Verify your email

### 2️⃣ Login to Railway CLI
```powershell
railway login
```
This will open a browser window. Click "Authorize" and return to terminal.

### 3️⃣ Initialize Project
```powershell
cd c:\Users\Waqas\Desktop\Waqas A to Z services\backend
railway init
```

When prompted:
- **Project name**: `a-to-z-backend`
- **Environment**: `production`

### 4️⃣ Add PostgreSQL Database
```powershell
railway add
```
Select:
- `PostgreSQL` - for database

### 5️⃣ Add Redis Cache
```powershell
railway add
```
Select:
- `Redis` - for caching

### 6️⃣ Set Environment Variables
```powershell
railway variables
```

Add these variables:
```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-ultra-secure-jwt-secret-key-change-this
CORS_ORIGIN=https://waqas-a-to-z-service-malakand.netlify.app
```

**Note**: Railway will automatically provide:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` (from PostgreSQL)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (from Redis)

### 7️⃣ Deploy
```powershell
railway up
```

Wait for deployment to complete. You'll see:
```
✓ Deployment successful!
✓ Your app is live at: https://a-to-z-backend-prod.railway.app
```

### 8️⃣ Verify Deployment
```powershell
# Check status
railway status

# View logs
railway logs

# Get URL
railway open
```

### 9️⃣ Test API
```powershell
# Health check
curl https://a-to-z-backend-prod.railway.app/health

# API docs
# Open in browser: https://a-to-z-backend-prod.railway.app/api/docs
```

---

## 🎯 That's It!

Your backend is now deployed and live! 🎉

**Your API URL**: `https://a-to-z-backend-prod.railway.app`

**API Documentation**: `https://a-to-z-backend-prod.railway.app/api/docs`

---

## 🔄 Redeployment

To redeploy after making changes:

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
```

---

## ❌ Troubleshooting

### Deployment Failed
```powershell
# Check logs
railway logs

# Rebuild
npm run build

# Redeploy
railway up
```

### Database Connection Error
- Verify environment variables are set correctly
- Check PostgreSQL is running in Railway dashboard
- Ensure DB_HOST, DB_USER, DB_PASSWORD are correct

### Port Already in Use
- Railway automatically assigns PORT 3001
- No action needed

### CORS Error
- Add your frontend URL to CORS_ORIGIN
- Update environment variable: `railway variables`

---

## 📞 Need Help?

- Railway Docs: https://docs.railway.app
- Railway Support: https://railway.app/support
- Check logs: `railway logs`

---

**Status**: ✅ Ready to Deploy
**Time to Deploy**: ~5 minutes
**Cost**: Free tier available
