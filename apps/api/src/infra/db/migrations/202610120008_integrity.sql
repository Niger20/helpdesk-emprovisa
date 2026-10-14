-- Up Migration
ALTER TABLE matriz_prioridad ADD CONSTRAINT uq_matriz UNIQUE (impacto, urgencia);
ALTER TABLE transiciones_estado ADD CONSTRAINT uq_transicion UNIQUE (id_estado_origen, id_estado_destino, automatica);
ALTER TABLE horarios_laborales ADD CONSTRAINT ck_horario CHECK (dia_semana BETWEEN 1 AND 7 AND hora_fin > hora_inicio);
ALTER TABLE feriados ADD CONSTRAINT uq_feriado UNIQUE (id_calendario, fecha);
ALTER TABLE prioridades_sla ADD CONSTRAINT ck_plazos CHECK (minutos_respuesta > 0 AND minutos_solucion >= minutos_respuesta AND porcentaje_alerta BETWEEN 1 AND 99);
ALTER TABLE usuarios ADD CONSTRAINT ck_origen_cuenta CHECK ((origen_cuenta = 'AD' AND guid_directorio IS NOT NULL AND password_hash IS NULL) OR (origen_cuenta = 'LOCAL' AND password_hash IS NOT NULL AND guid_directorio IS NULL));
ALTER TABLE tickets ADD CONSTRAINT ck_fechas_limite CHECK (fecha_limite_respuesta >= fecha_creacion AND fecha_limite_solucion >= fecha_creacion);
ALTER TABLE tickets ADD CONSTRAINT ck_prioridad_manual CHECK (NOT prioridad_manual OR length(trim(justificacion_prioridad)) > 0);
ALTER TABLE tickets ADD CONSTRAINT ck_minutos_pausa CHECK (minutos_pausa >= 0);
ALTER TABLE pausas_sla ADD CONSTRAINT ck_pausa CHECK (motivo IN ('REPUESTOS', 'PROVEEDOR_EXTERNO') AND length(trim(detalle)) > 0 AND (fin IS NULL OR fin >= inicio));
ALTER TABLE ticket_resoluciones ADD CONSTRAINT uq_resolucion_ciclo UNIQUE (id_ticket, ciclo);
ALTER TABLE encuestas_csat ADD CONSTRAINT ck_calificacion CHECK (calificacion BETWEEN 1 AND 5 AND expira_en > enviada_en);
ALTER TABLE ticket_adjuntos ADD CONSTRAINT ck_tamano CHECK (tamano_bytes > 0);
ALTER TABLE articulos_kb_versiones ADD CONSTRAINT uq_version_articulo UNIQUE (id_articulo, numero_version);
CREATE INDEX idx_tickets_estado_sede ON tickets (id_estado, id_sede);
CREATE INDEX idx_tickets_asignado_estado ON tickets (id_asignado, id_estado);
CREATE INDEX idx_tickets_limite ON tickets (fecha_limite_solucion) WHERE fecha_resolucion IS NULL AND fecha_cierre IS NULL;
CREATE INDEX idx_sla_alertas_pendiente ON sla_alertas (estado, programada_para) WHERE estado = 'PENDIENTE';
CREATE INDEX idx_bitacora_ticket_fecha ON bitacora (id_ticket, fecha_hora);
CREATE INDEX idx_notificaciones_pendiente ON notificaciones (estado) WHERE estado = 'PENDIENTE';

CREATE FUNCTION validar_activo_ticket() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM categorias WHERE id_categoria = NEW.id_categoria AND requiere_activo) AND NEW.id_activo IS NULL THEN
    RAISE EXCEPTION 'La categoría requiere un activo' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER ticket_requiere_activo BEFORE INSERT OR UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION validar_activo_ticket();

CREATE FUNCTION validar_resolutor_ticket() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM tickets WHERE id_ticket = NEW.id_ticket AND id_solicitante = NEW.id_resolutor) THEN
    RAISE EXCEPTION 'El solicitante no puede resolver su ticket' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER resolucion_segregacion BEFORE INSERT OR UPDATE ON ticket_resoluciones FOR EACH ROW EXECUTE FUNCTION validar_resolutor_ticket();

-- Down Migration
DROP TRIGGER resolucion_segregacion ON ticket_resoluciones;
DROP FUNCTION validar_resolutor_ticket();
DROP TRIGGER ticket_requiere_activo ON tickets;
DROP FUNCTION validar_activo_ticket();
DROP INDEX idx_notificaciones_pendiente, idx_bitacora_ticket_fecha, idx_sla_alertas_pendiente, idx_tickets_limite, idx_tickets_asignado_estado, idx_tickets_estado_sede;
ALTER TABLE articulos_kb_versiones DROP CONSTRAINT uq_version_articulo;
ALTER TABLE ticket_adjuntos DROP CONSTRAINT ck_tamano;
ALTER TABLE encuestas_csat DROP CONSTRAINT ck_calificacion;
ALTER TABLE ticket_resoluciones DROP CONSTRAINT uq_resolucion_ciclo;
ALTER TABLE pausas_sla DROP CONSTRAINT ck_pausa;
ALTER TABLE tickets DROP CONSTRAINT ck_minutos_pausa, DROP CONSTRAINT ck_prioridad_manual, DROP CONSTRAINT ck_fechas_limite;
ALTER TABLE usuarios DROP CONSTRAINT ck_origen_cuenta;
ALTER TABLE prioridades_sla DROP CONSTRAINT ck_plazos;
ALTER TABLE feriados DROP CONSTRAINT uq_feriado;
ALTER TABLE horarios_laborales DROP CONSTRAINT ck_horario;
ALTER TABLE transiciones_estado DROP CONSTRAINT uq_transicion;
ALTER TABLE matriz_prioridad DROP CONSTRAINT uq_matriz;
