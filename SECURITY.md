# Security Guide

## 🔐 Authentication & Authorization

### JWT Implementation
- **Access Token**: 15-minute expiration
- **Refresh Token**: 7-day expiration
- **Secret**: Minimum 32 characters, change in production
- **Algorithm**: HS256 (HMAC with SHA-256)

```typescript
// Example: JWT payload
{
  sub: "user-uuid",
  email: "user@example.com",
  role: "user",
  iat: 1234567890,
  exp: 1234568790
}
```

### Multi-Factor Authentication (MFA)
- **Type**: Time-based One-Time Password (TOTP)
- **Algorithm**: HMAC-SHA1
- **Window**: ±2 time steps (60 seconds)
- **QR Code**: Generated for easy setup
- **Backup Codes**: Implement for account recovery

### Role-Based Access Control
```
Super Admin  → Full system access, user management, audit logs
Admin        → Application approval, user support, analytics
Moderator    → Document verification, status updates
Support      → User assistance, ticket management
User         → Own application management only
```

## 🛡️ Data Protection

### Password Security
- **Hashing**: bcrypt with 10 salt rounds
- **Minimum Length**: 8 characters
- **Complexity**: Uppercase, lowercase, number, special character
- **Validation**: Real-time strength meter

### Input Validation
- **DTOs**: class-validator with strict rules
- **Sanitization**: XSS prevention via DOMPurify
- **SQL Injection**: Parameterized queries via TypeORM
- **Rate Limiting**: 5 attempts per 15 minutes

### Account Lockout
```
Failed Attempts  → Action
1-4              → Warning
5                → 15-minute lockout
6-10             → 1-hour lockout
11+              → Manual admin unlock required
```

## 🔒 Database Security

### Row-Level Security (RLS)
```sql
-- Users can only see their own data
CREATE POLICY user_isolation ON applications
  USING (user_id = current_user_id());
```

### Column-level Encryption
- **PII Fields**: Password, MFA secret, sensitive metadata
- **Algorithm**: AES-256-GCM
- **Key Management**: Separate from application code

### Audit Logging
- **Immutable**: Append-only audit log table
- **Tamper Detection**: Hash-based verification
- **Retention**: 7 years (configurable)
- **Indexed**: Fast queries on user_id, action, created_at

## 🌐 Network Security

### CORS Configuration
```typescript
// Whitelist specific origins
CORS_ORIGIN=https://app.example.com,https://admin.example.com
```

### Security Headers
```
Helmet.js provides:
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
```

### HTTPS/TLS
- **Minimum**: TLS 1.2
- **Recommended**: TLS 1.3
- **Certificates**: Let's Encrypt (free) or commercial

## 🔑 Secrets Management

### Environment Variables
```bash
# Never commit .env files
# Use .env.example as template
# Rotate secrets regularly
# Use strong random values (32+ characters)
```

### Production Secrets
- **Vault**: HashiCorp Vault for centralized management
- **KMS**: AWS KMS / Google Cloud KMS
- **Rotation**: Automatic rotation every 90 days

## 🚨 Error Handling

### Secure Error Messages
```typescript
// ❌ Don't expose internal details
throw new Error("Database connection failed");

// ✅ Return generic message to client
throw new UnauthorizedException("Invalid credentials");
```

### Logging
```typescript
// Log sensitive data only in secure environment
logger.error('Failed login for user', { userId, ip });

// Never log passwords or tokens
```

## 📋 Security Checklist

### Development
- [ ] Use HTTPS in development (localhost OK)
- [ ] Validate all inputs
- [ ] Use parameterized queries
- [ ] Implement rate limiting
- [ ] Add CORS restrictions
- [ ] Use security headers
- [ ] Implement MFA for admins
- [ ] Enable audit logging

### Deployment
- [ ] Change all default credentials
- [ ] Use strong JWT secret (32+ chars)
- [ ] Enable database SSL
- [ ] Setup firewall rules
- [ ] Configure WAF
- [ ] Enable DDoS protection
- [ ] Setup monitoring & alerts
- [ ] Enable database backups
- [ ] Implement disaster recovery
- [ ] Run security audit

### Ongoing
- [ ] Regular penetration testing
- [ ] Dependency updates
- [ ] Security patches
- [ ] Access reviews
- [ ] Backup restoration tests
- [ ] Incident response drills

## 🔍 Vulnerability Scanning

### SAST (Static Application Security Testing)
```bash
npm audit                    # Check dependencies
npm run lint                 # Code quality
```

### DAST (Dynamic Application Security Testing)
```bash
# Use OWASP ZAP or Burp Suite
# Test for: SQL injection, XSS, CSRF, etc.
```

### Dependency Management
```bash
npm outdated                 # Check for updates
npm audit fix                # Auto-fix vulnerabilities
npm update                   # Update dependencies
```

## 📞 Security Incident Response

### Reporting
- Email: security@example.com
- Do not disclose publicly until patched
- Provide detailed reproduction steps

### Response Timeline
- **Immediate**: Acknowledge receipt
- **24 hours**: Initial assessment
- **72 hours**: Patch development
- **7 days**: Patch deployment

## 🔗 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated**: December 2024
**Reviewed By**: Security Team
