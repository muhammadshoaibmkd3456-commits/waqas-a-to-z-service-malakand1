# A to Z Services - Ultra-Premium Backend

Production-ready NestJS backend with enterprise-grade security, scalability, and reliability.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+ (or use Docker)
- Redis 7+ (or use Docker)

### Installation

```bash
# Clone and install
cd backend
npm install

# Setup environment
cp .env.example .env.local

# Start with Docker
docker-compose up -d

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
```

Access:
- **API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api/docs
- **PgAdmin**: http://localhost:5050 (admin@example.com / admin)
- **Redis Commander**: http://localhost:8081

## 📋 Project Structure

```
backend/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── common/                 # Shared utilities
│   │   ├── filters/            # Exception filters
│   │   ├── guards/             # Auth guards (JWT, Roles)
│   │   ├── decorators/         # Custom decorators
│   │   └── interceptors/       # Logging, transformation
│   ├── database/
│   │   ├── entities/           # TypeORM entities
│   │   │   ├── user.entity.ts
│   │   │   ├── application.entity.ts
│   │   │   ├── document.entity.ts
│   │   │   ├── payment.entity.ts
│   │   │   └── audit-log.entity.ts
│   │   └── migrations/         # Database migrations
│   └── modules/
│       ├── auth/               # Authentication & MFA
│       ├── users/              # User management
│       ├── applications/       # Application lifecycle
│       ├── documents/          # Document upload & processing
│       ├── notifications/      # Email, SMS, Push
│       ├── payments/           # Payment processing
│       ├── admin/              # Admin panel
│       └── health/             # Health checks
├── docker-compose.yml          # Local development stack
├── Dockerfile                  # Production image
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Security Features

### Authentication & Authorization
- **JWT + Refresh Tokens**: 15-minute access tokens, 7-day refresh tokens
- **Multi-Factor Authentication (MFA)**: TOTP-based 2FA with QR codes
- **Role-Based Access Control (RBAC)**: Super Admin, Admin, Moderator, Support, User
- **Account Lockout**: 5 failed attempts → 15-minute lockout
- **Session Management**: IP tracking, login history

### Data Protection
- **Password Hashing**: bcrypt with 10 salt rounds
- **Input Validation**: Zod/class-validator for all DTOs
- **CORS Protection**: Configurable origin whitelist
- **Helmet.js**: Security headers (CSP, HSTS, X-Frame-Options)
- **Rate Limiting**: Ready for integration (5 attempts/15 min)

### Database Security
- **Row-Level Security (RLS)**: User data isolation
- **Column-level Encryption**: PII fields encrypted at rest
- **Audit Logging**: Immutable logs with tamper detection
- **Connection Pooling**: PgBouncer-ready configuration

## 📊 Database Schema

### Users Table
- UUID primary key
- Email & phone (unique, indexed)
- Password (bcrypt hashed)
- Role-based access control
- MFA secret (encrypted)
- Account status & lockout tracking
- Soft delete support

### Applications Table
- Full lifecycle management (Draft → Completed)
- Service type enumeration (Police Clearance, Passport, etc.)
- QR code generation & tracking
- Form data & metadata (JSONB)
- Payment tracking
- Audit trail

### Documents Table
- File upload with hash verification
- Status tracking (Pending, Verified, Rejected)
- Metadata extraction
- Expiry date tracking
- Verification audit trail

### Payments Table
- Multiple payment methods (Card, Bank, EasyPaisa, JazzCash, Stripe)
- Transaction tracking
- Failure reason logging
- Refund support

### Audit Logs Table
- Immutable action history
- IP & user agent tracking
- Change tracking (before/after)
- Indexed for fast queries

## 🔌 API Endpoints

### Authentication
```
POST   /api/v1/auth/register          # User registration
POST   /api/v1/auth/login             # Login with optional MFA
POST   /api/v1/auth/refresh           # Refresh access token
POST   /api/v1/auth/logout            # Logout
GET    /api/v1/auth/mfa/setup         # Setup 2FA
POST   /api/v1/auth/mfa/confirm       # Confirm 2FA
```

### Applications
```
GET    /api/v1/applications           # List user applications
POST   /api/v1/applications           # Create new application
GET    /api/v1/applications/:id       # Get application details
PUT    /api/v1/applications/:id       # Update application
POST   /api/v1/applications/:id/submit # Submit application
```

### Documents
```
POST   /api/v1/documents/upload       # Upload document
GET    /api/v1/documents/:id          # Get document
DELETE /api/v1/documents/:id          # Delete document
```

### Payments
```
POST   /api/v1/payments/create        # Create payment
GET    /api/v1/payments/:id           # Get payment status
POST   /api/v1/payments/:id/refund    # Request refund
```

### Admin (Protected)
```
GET    /api/v1/admin/users            # List all users
GET    /api/v1/admin/applications     # List all applications
GET    /api/v1/admin/audit-logs       # View audit logs
POST   /api/v1/admin/applications/:id/approve
POST   /api/v1/admin/applications/:id/reject
```

## 🛠️ Development

### Running Tests
```bash
npm run test              # Unit tests
npm run test:watch       # Watch mode
npm run test:cov         # Coverage report
npm run test:e2e         # E2E tests
```

### Database Migrations
```bash
# Generate migration from entity changes
npm run migration:generate -- -n AddNewColumn

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Linting & Formatting
```bash
npm run lint             # Run ESLint
npm run format           # Format with Prettier
```

## 📦 Deployment

### Docker Build
```bash
docker build -t a-to-z-backend:latest .
docker run -p 3001:3001 --env-file .env a-to-z-backend:latest
```

### Environment Variables
See `.env.example` for all required variables:
- Database credentials
- Redis connection
- JWT secret
- Third-party API keys (Stripe, Twilio, SendGrid)
- AWS S3 credentials
- Sentry DSN

### Production Checklist
- [ ] Set strong JWT_SECRET
- [ ] Enable database SSL
- [ ] Configure CORS_ORIGIN
- [ ] Setup Redis password
- [ ] Configure all third-party API keys
- [ ] Enable Sentry monitoring
- [ ] Setup automated backups
- [ ] Configure WAF & DDoS protection
- [ ] Enable database replication
- [ ] Setup CI/CD pipeline

## 📈 Performance

### Optimization Strategies
- **Connection Pooling**: PgBouncer with 20 max connections
- **Redis Caching**: 5-minute TTL for high-read endpoints
- **Database Indexing**: Strategic indexes on foreign keys & status fields
- **Query Optimization**: Eager loading with TypeORM relations
- **Async Processing**: BullMQ for document processing & notifications

### Monitoring
- **Prometheus Metrics**: Ready for integration
- **Grafana Dashboards**: Template included
- **Sentry Error Tracking**: Automatic error reporting
- **Structured Logging**: JSON logs for ELK stack

## 🔄 CI/CD

### GitHub Actions Pipeline
```yaml
- Lint & Format Check
- Unit Tests
- Security Scanning (SAST)
- Build Docker Image
- Push to Registry
- Deploy to Staging
- Run E2E Tests
- Deploy to Production
```

## 📚 Additional Resources

- **Swagger Docs**: Auto-generated API documentation
- **Database Diagram**: See `docs/database-schema.md`
- **Security Guide**: See `docs/SECURITY.md`
- **Deployment Guide**: See `docs/DEPLOYMENT.md`

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open Pull Request

## 📝 License

ISC

## 📞 Support

For issues and questions, please contact the development team.

---

**Built with ❤️ using NestJS, PostgreSQL, Redis, and TypeScript**
