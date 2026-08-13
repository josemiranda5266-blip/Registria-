-- Migration 001: Initial Schema for REGISTRIA
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(64) PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(128) NOT NULL,
  name VARCHAR(128) NOT NULL,
  role VARCHAR(32) NOT NULL,
  organization_id VARCHAR(64) DEFAULT 'org-registria-default',
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  must_change_password BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) UNIQUE NOT NULL,
  role VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  created_by VARCHAR(64),
  name VARCHAR(128) NOT NULL,
  dni_cuit VARCHAR(32) NOT NULL,
  type VARCHAR(32) NOT NULL,
  phone VARCHAR(64),
  email VARCHAR(128),
  address TEXT,
  notes TEXT,
  cases_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cases (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  created_by VARCHAR(64),
  assigned_to VARCHAR(64),
  case_number VARCHAR(64) UNIQUE NOT NULL,
  title VARCHAR(256) NOT NULL,
  client_id VARCHAR(64) REFERENCES clients(id) ON DELETE SET NULL,
  client_name VARCHAR(128),
  client_dni_cuit VARCHAR(32),
  vehicle_domain VARCHAR(16) NOT NULL,
  vehicle_brand_model VARCHAR(128),
  procedure_id VARCHAR(64) NOT NULL,
  procedure_title VARCHAR(256),
  status VARCHAR(32) NOT NULL,
  checklist JSONB DEFAULT '[]'::jsonb,
  uploaded_docs JSONB DEFAULT '[]'::jsonb,
  notes JSONB DEFAULT '[]'::jsonb,
  turns_date VARCHAR(64),
  fees_amount NUMERIC(12, 2) DEFAULT 0,
  fees_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS norms (
  document_id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(256) NOT NULL,
  document_type VARCHAR(64) NOT NULL,
  issuing_authority VARCHAR(64) NOT NULL,
  number VARCHAR(64) NOT NULL,
  year INT NOT NULL,
  publication_date VARCHAR(32),
  effective_date VARCHAR(32),
  status VARCHAR(32) NOT NULL,
  topics JSONB DEFAULT '[]'::jsonb,
  subtopics JSONB DEFAULT '[]'::jsonb,
  vehicle_types JSONB DEFAULT '[]'::jsonb,
  source_url TEXT,
  official_source BOOLEAN DEFAULT TRUE,
  content TEXT NOT NULL,
  content_hash VARCHAR(128) NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  version VARCHAR(32),
  summary TEXT
);

CREATE TABLE IF NOT EXISTS analyzed_docs (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) DEFAULT 'org-registria-default',
  uploaded_by VARCHAR(64),
  file_name VARCHAR(256) NOT NULL,
  document_type VARCHAR(64) NOT NULL,
  extracted_fields JSONB DEFAULT '{}'::jsonb,
  raw_ocr_text TEXT,
  confidence_score NUMERIC(5, 4) DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id VARCHAR(64),
  username VARCHAR(64),
  user_role VARCHAR(32),
  action VARCHAR(64) NOT NULL,
  entity VARCHAR(32) NOT NULL,
  entity_id VARCHAR(64),
  details TEXT,
  ip_address VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_cases_org ON cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_norms_status ON norms(status);
