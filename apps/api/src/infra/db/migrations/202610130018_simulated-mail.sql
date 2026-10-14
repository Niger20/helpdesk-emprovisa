-- Up Migration
ALTER TABLE correos_entrantes ADD COLUMN datos_simulados jsonb;
-- Down Migration
ALTER TABLE correos_entrantes DROP COLUMN datos_simulados;
