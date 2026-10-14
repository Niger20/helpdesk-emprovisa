-- Up Migration
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO helpdesk_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO helpdesk_readonly;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO helpdesk_app;
REVOKE UPDATE, DELETE, TRUNCATE ON bitacora, auditoria_sistema FROM helpdesk_app;
REVOKE ALL ON pgmigrations FROM helpdesk_app, helpdesk_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE helpdesk_migrator IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Down Migration
ALTER DEFAULT PRIVILEGES FOR ROLE helpdesk_migrator IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM helpdesk_app, helpdesk_readonly;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM helpdesk_app;
