-- AVALA PostgreSQL Initialization Script
-- Creates database with proper locale for Mexican Spanish

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Create read-only user (for analytics/reporting)
CREATE USER avala_readonly WITH PASSWORD 'readonly';

-- Grant minimal privileges
GRANT CONNECT ON DATABASE avala TO avala_readonly;
GRANT USAGE ON SCHEMA public TO avala_readonly;

-- Note: Table-level grants will be added after migrations
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO avala_readonly;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'AVALA database initialized successfully';
END $$;
