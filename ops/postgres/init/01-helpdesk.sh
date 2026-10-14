#!/usr/bin/env bash
set -euo pipefail

: "${POSTGRES_USER:=postgres}"
: "${HELPDESK_MIGRATOR_PASSWORD:?Falta contraseña migrator}"
: "${HELPDESK_APP_PASSWORD:?Falta contraseña app}"
: "${HELPDESK_READONLY_PASSWORD:?Falta contraseña readonly}"

psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres <<'SQL'
SET password_encryption = 'scram-sha-256';
\getenv migrator_password HELPDESK_MIGRATOR_PASSWORD
\getenv app_password HELPDESK_APP_PASSWORD
\getenv readonly_password HELPDESK_READONLY_PASSWORD
SELECT format('CREATE ROLE helpdesk_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L', :'migrator_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'helpdesk_migrator') \gexec
SELECT format('CREATE ROLE helpdesk_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L', :'app_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'helpdesk_app') \gexec
SELECT format('CREATE ROLE helpdesk_readonly LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L', :'readonly_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'helpdesk_readonly') \gexec
SELECT 'CREATE DATABASE helpdesk OWNER helpdesk_migrator'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'helpdesk') \gexec
SELECT 'CREATE DATABASE helpdesk_test OWNER helpdesk_migrator'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'helpdesk_test') \gexec
REVOKE ALL ON DATABASE helpdesk, helpdesk_test FROM PUBLIC;
GRANT CONNECT ON DATABASE helpdesk, helpdesk_test TO helpdesk_migrator, helpdesk_app, helpdesk_readonly;
ALTER ROLE helpdesk_readonly SET default_transaction_read_only = on;
SQL

for database in helpdesk helpdesk_test; do
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$database" <<'SQL'
CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER SCHEMA public OWNER TO helpdesk_migrator;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO helpdesk_app, helpdesk_readonly;
CREATE SCHEMA IF NOT EXISTS pgboss AUTHORIZATION helpdesk_app;
SQL
done
