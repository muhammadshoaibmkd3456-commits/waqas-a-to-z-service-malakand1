# ⚡ Quick Start - 5 Minutes to Running Backend

## Step 1: Install Dependencies (2 min)
```bash
cd backend
npm install
```

## Step 2: Setup Environment (1 min)
```bash
cp .env.example .env.local
```

## Step 3: Start Services (1 min)
```bash
docker-compose up -d
```

## Step 4: Run Migrations (30 sec)
```bash
npm run migration:run
```

## Step 5: Start Backend (30 sec)
```bash
npm run start:dev
```

---

## 🎯 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **API** | http://localhost:3001 | - |
| **Swagger Docs** | http://localhost:3001/api/docs | - |
| **PgAdmin** | http://localhost:5050 | admin@example.com / admin |
| **Redis Commander** | http://localhost:8081 | - |

---

## 🧪 Test the API

### 1. Register User
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 3. Use Token
```bash
# Copy accessToken from login response
curl -X GET http://localhost:3001/api/v1/applications \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/main.ts` | Application entry point |
| `src/app.module.ts` | Root module |
| `src/modules/auth/` | Authentication system |
| `src/database/entities/` | Database models |
| `docker-compose.yml` | Local dev stack |
| `.env.example` | Environment template |

---

## 🛠️ Useful Commands

```bash
# Development
npm run start:dev              # Start with hot reload
npm run lint                   # Check code quality
npm run format                 # Format code

# Database
npm run migration:generate     # Create migration
npm run migration:run          # Run migrations
npm run migration:revert       # Undo migration

# Docker
docker-compose ps              # Check services
docker-compose logs -f         # View logs
docker-compose down            # Stop all services
```

---

## 🐛 Troubleshooting

### Port 3001 Already in Use
```bash
lsof -i :3001
kill -9 <PID>
```

### Database Connection Error
```bash
docker-compose restart postgres
npm run migration:run
```

### Redis Connection Error
```bash
docker-compose restart redis
```

---

## 📚 Full Documentation

- **README.md** - Complete overview
- **SETUP_GUIDE.md** - Detailed setup instructions
- **SECURITY.md** - Security implementation
- **DEPLOYMENT.md** - Production deployment
- **BACKEND_IMPLEMENTATION_COMPLETE.md** - Full implementation details

---

## ✅ Next Steps

1. ✅ Backend running locally
2. → Integrate with Next.js frontend
3. → Add third-party services (Stripe, SendGrid, Twilio)
4. → Deploy to production
5. → Monitor & scale

---

**You're all set! 🚀**
