-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable Row Level Security
ALTER DATABASE a_to_z_db SET "app.jwt_secret" = 'your-secret';

-- Create schema
CREATE SCHEMA IF NOT EXISTS public;

-- Create audit function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource, changes, ip_address, created_at)
  VALUES (
    COALESCE(current_setting('app.user_id', true)::uuid, NULL),
    TG_ARGV[0]::audit_action,
    TG_TABLE_NAME,
    row_to_json(NEW),
    current_setting('app.ip_address', true),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_payments_application_id ON payments(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create materialized view for analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS application_stats AS
SELECT
  DATE_TRUNC('day', a.created_at) as date,
  a.service_type,
  a.status,
  COUNT(*) as count,
  SUM(a.total_fee) as total_revenue
FROM applications a
GROUP BY DATE_TRUNC('day', a.created_at), a.service_type, a.status;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_application_stats_date ON application_stats(date);

COMMIT;
