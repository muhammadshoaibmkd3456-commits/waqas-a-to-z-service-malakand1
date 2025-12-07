# ⚡ Quick Fix - Dependency Resolution Error

**Error**: `ERESOLVE unable to resolve dependency tree`

**Solution**: Use `--legacy-peer-deps` flag

---

## 🔧 Fix It Now

```bash
cd backend

# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -r node_modules
rm package-lock.json

# Install with legacy peer deps flag
npm install --legacy-peer-deps

# Expected output:
# added 500+ packages
```

---

## ✅ Then Continue Setup

```bash
# 1. Run migrations
npm run migration:run

# 2. Start backend
npm run start:dev

# 3. In new terminal, start frontend
npm run dev
```

---

## 🎯 If Still Having Issues

Try this alternative:

```bash
# Use npm ci instead
npm ci --legacy-peer-deps

# Then run migrations
npm run migration:run
```

---

**That's it! Should work now.**
