# Complete Backend Setup Guide

## 📋 Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Project Structure](#project-structure)
3. [Core Features](#core-features)
4. [API Documentation](#api-documentation)
5. [Database Schema](#database-schema)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ Local Development Setup

### Step 1: Prerequisites
```bash
# Check Node.js version (20+ required)
node --version

# Check npm version (10+ required)
npm --version

# Install Docker Desktop
# https://www.docker.com/products/docker-desktop
```

### Step 2: Clone & Install
```bash
cd backend
npm install
```

### Step 3: Environment Configuration
```bash
# Copy example env file
cp .env.example .env.local

# Edit with your values
nano .env.local
```

### Step 4: Start Services
```bash
# Start PostgreSQL, Redis, PgAdmin, Redis Commander
docker-compose up -d

# Verify services
docker-compose ps

# Check logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Step 5: Database Setup
```bash
# Run migrations
npm run migration:run

# Seed sample data (optional)
npm run seed
```

### Step 6: Start Backend
```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### Step 7: Verify Installation
```bash
# Check API health
curl http://localhost:3001/api/health

# View Swagger docs
open http://localhost:3001/api/docs

# Access PgAdmin
open http://localhost:5050

# Access Redis Commander
open http://localhost:8081
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── main.ts                          # Entry point
│   ├── app.module.ts                    # Root module
│   │
│   ├── common/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts # Global error handler
│   │   ├── guards/
│   │   │   ├── jwt.guard.ts             # JWT authentication
│   │   │   └── roles.guard.ts           # Role-based access
│   │   ├── decorators/
│   │   │   └── roles.decorator.ts       # @Roles() decorator
│   │   └── interceptors/
│   │       └── logging.interceptor.ts   # Request/response logging
│   │
│   ├── database/
│   │   ├── entities/
│   │   │   ├── user.entity.ts           # User model
│   │   │   ├── application.entity.ts    # Application model
│   │   │   ├── document.entity.ts       # Document model
│   │   │   ├── payment.entity.ts        # Payment model
│   │   │   └── audit-log.entity.ts      # Audit log model
│   │   └── migrations/
│   │       └── *.ts                     # Database migrations
│   │
│   └── modules/
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.service.ts
│       │   ├── auth.controller.ts
│       │   ├── strategies/
│       │   │   └── jwt.strategy.ts
│       │   └── dto/
│       │       ├── login.dto.ts
│       │       └── register.dto.ts
│       │
│       ├── users/
│       │   └── users.module.ts
│       │
│       ├── applications/
│       │   └── applications.module.ts
│       │
│       ├── documents/
│       │   └── documents.module.ts
│       │
│       ├── notifications/
│       │   └── notifications.module.ts
│       │
│       ├── payments/
│       │   └── payments.module.ts
│       │
│       ├── admin/
│       │   └── admin.module.ts
│       │
│       └── health/
│           └── health.module.ts
│
├── scripts/
│   └── init.sql                         # Database initialization
│
├── docker-compose.yml                   # Local dev stack
├── Dockerfile                           # Production image
├── package.json
├── tsconfig.json
├── nest-cli.json
├── README.md
├── SECURITY.md
├── DEPLOYMENT.md
└── SETUP_GUIDE.md
```

---

## ✨ Core Features

### 1. Authentication System
- **Registration**: Email validation, password strength checking
- **Login**: JWT tokens with refresh mechanism
- **MFA**: TOTP-based 2FA with QR code setup
- **Account Security**: Lockout after failed attempts

### 2. Application Lifecycle
- **Draft**: Initial creation
- **Submitted**: Ready for review
- **Missing Docs**: Request additional documents
- **Under Review**: Admin review process
- **Approved/Rejected**: Final decision
- **Completed**: Finished applications

### 3. Document Management
- **Upload**: Chunked file uploads (max 100MB)
- **Verification**: Admin review & approval
- **Storage**: S3-compatible storage
- **Tracking**: Hash verification & metadata

### 4. Payment Processing
- **Multiple Methods**: Card, Bank, EasyPaisa, JazzCash, Stripe
- **Status Tracking**: Pending, Processing, Completed, Failed
- **Refunds**: Support for refund requests
- **Audit Trail**: All transactions logged

### 5. Admin Panel
- **User Management**: View, suspend, unlock accounts
- **Application Queue**: Approve/reject with comments
- **Document Verification**: Review uploaded documents
- **Audit Logs**: View all system actions
- **Analytics**: Dashboard with key metrics

### 6. Notifications
- **Email**: SendGrid integration
- **SMS**: Twilio integration
- **Push**: Firebase Cloud Messaging
- **Templates**: Multilingual support (English + Urdu)

---

## 📚 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+923001234567",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}

Response: 201 Created
{
  "id": "uuid",
  "email": "john@example.com",
  "message": "Registration successful. Please verify your email."
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "mfaCode": "123456" // Optional if MFA enabled
}

Response: 200 OK
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response: 200 OK
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { ... }
}
```

#### Setup MFA
```http
GET /api/v1/auth/mfa/setup
Authorization: Bearer <accessToken>

Response: 200 OK
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qrCode": "data:image/png;base64,..."
}
```

#### Confirm MFA
```http
POST /api/v1/auth/mfa/confirm
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "mfaCode": "123456",
  "secret": "JBSWY3DPEBLW64TMMQ======"
}

Response: 200 OK
{
  "message": "MFA enabled successfully"
}
```

### Application Endpoints

#### Create Application
```http
POST /api/v1/applications
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "serviceType": "police_clearance",
  "formData": {
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-01",
    "cnic": "12345-1234567-1"
  }
}

Response: 201 Created
{
  "id": "uuid",
  "qrCode": "uuid",
  "referenceNumber": "ATZ-2024-001",
  "status": "draft",
  "progress": 20
}
```

#### Get Applications
```http
GET /api/v1/applications?status=submitted&limit=10&offset=0
Authorization: Bearer <accessToken>

Response: 200 OK
{
  "data": [ ... ],
  "total": 45,
  "limit": 10,
  "offset": 0
}
```

#### Submit Application
```http
POST /api/v1/applications/:id/submit
Authorization: Bearer <accessToken>

Response: 200 OK
{
  "id": "uuid",
  "status": "submitted",
  "submittedAt": "2024-12-02T12:00:00Z"
}
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password VARCHAR(255),
  role ENUM('super_admin', 'admin', 'moderator', 'support', 'user'),
  status ENUM('active', 'inactive', 'suspended', 'pending_verification'),
  emailVerified BOOLEAN,
  phoneVerified BOOLEAN,
  mfaEnabled BOOLEAN,
  mfaSecret VARCHAR(255),
  lastLoginAt TIMESTAMP,
  lastLoginIp VARCHAR(45),
  failedLoginAttempts INTEGER,
  lockedUntil TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP
);
```

### Applications Table
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES users(id),
  serviceType ENUM('police_clearance', 'domicile', 'passport', ...),
  status ENUM('draft', 'submitted', 'missing_docs', 'under_review', 'approved', 'rejected', 'completed'),
  qrCode VARCHAR(36) UNIQUE,
  referenceNumber VARCHAR(50) UNIQUE,
  formData JSONB,
  totalFee DECIMAL(10,2),
  paidAmount DECIMAL(10,2),
  submittedAt TIMESTAMP,
  approvedAt TIMESTAMP,
  completedAt TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP
);
```

### Documents Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  applicationId UUID REFERENCES applications(id),
  documentType VARCHAR(100),
  fileName VARCHAR(255),
  fileUrl VARCHAR(255),
  mimeType VARCHAR(50),
  fileSize BIGINT,
  fileHash VARCHAR(64),
  status ENUM('pending', 'verified', 'rejected', 'expired'),
  metadata JSONB,
  verifiedAt TIMESTAMP,
  verifiedBy VARCHAR(255),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

---

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Specific test file
npm run test:e2e -- auth.e2e-spec.ts
```

### Manual Testing with Postman
1. Import `postman-collection.json`
2. Set environment variables
3. Run requests in sequence

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Database Connection Error
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart service
docker-compose restart postgres
```

### Redis Connection Error
```bash
# Check Redis is running
docker-compose ps redis

# Test connection
redis-cli -h localhost ping

# Restart service
docker-compose restart redis
```

### Migration Issues
```bash
# Revert last migration
npm run migration:revert

# Check migration status
npm run typeorm -- migration:show

# Generate new migration
npm run migration:generate -- -n DescriptiveName
```

### Memory Issues
```bash
# Increase Node.js memory
NODE_OPTIONS=--max-old-space-size=4096 npm run start:dev

# Check memory usage
node --expose-gc -e "setInterval(() => console.log(Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'), 1000)"
```

---

## 📞 Getting Help

- **Documentation**: See README.md, SECURITY.md, DEPLOYMENT.md
- **Issues**: Create GitHub issue with reproduction steps
- **Discussions**: Use GitHub Discussions for questions
- **Email**: backend-team@example.com

---

**Last Updated**: December 2024
**Version**: 1.0.0
