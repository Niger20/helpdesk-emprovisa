-- Up Migration
ALTER TABLE tickets DROP CONSTRAINT ck_prioridad_manual;
ALTER TABLE tickets ADD CONSTRAINT ck_prioridad_manual CHECK (NOT prioridad_manual OR coalesce(length(trim(justificacion_prioridad)), 0) > 0);
CREATE UNIQUE INDEX uq_admin_emergencia_local ON usuarios (origen_cuenta) WHERE origen_cuenta = 'LOCAL';
DROP INDEX idx_tickets_limite;
CREATE INDEX idx_tickets_limite ON tickets (fecha_limite_solucion) WHERE id_estado NOT IN (7, 9);

-- Down Migration
DROP INDEX idx_tickets_limite;
CREATE INDEX idx_tickets_limite ON tickets (fecha_limite_solucion) WHERE fecha_resolucion IS NULL AND fecha_cierre IS NULL;
DROP INDEX uq_admin_emergencia_local;
ALTER TABLE tickets DROP CONSTRAINT ck_prioridad_manual;
ALTER TABLE tickets ADD CONSTRAINT ck_prioridad_manual CHECK (NOT prioridad_manual OR length(trim(justificacion_prioridad)) > 0);
