-- Up Migration
ALTER TABLE notificaciones ADD COLUMN id_bitacora bigint REFERENCES bitacora(id_bitacora);
ALTER TABLE notificaciones ADD COLUMN proximo_intento timestamptz NOT NULL DEFAULT now();
ALTER TABLE notificaciones ADD CONSTRAINT uq_notificacion_evento UNIQUE (id_bitacora, id_destinatario);
CREATE INDEX idx_notificaciones_reintento ON notificaciones(proximo_intento) WHERE estado = 'PENDIENTE';
INSERT INTO plantillas_notificacion (id_plantilla, codigo_evento, asunto, cuerpo, activa) VALUES
  (20, 'CREACION', 'Ticket registrado', 'Se registró tu requerimiento.', true),
  (21, 'ASIGNACION', 'Responsable asignado', 'Se asignó un responsable al requerimiento.', true),
  (22, 'ESCALAMIENTO', 'Ticket escalado', 'El requerimiento requiere atención de segundo nivel.', true),
  (23, 'RESOLUCION', 'Solución registrada', 'Revisá la solución en el portal.', true),
  (24, 'CIERRE', 'Ticket cerrado', 'El requerimiento fue cerrado.', true),
  (25, 'ALERTA_SLA', 'Alerta de plazo SLA', 'Se consumió el umbral de la ventana de solución.', true)
ON CONFLICT (codigo_evento) DO NOTHING;
INSERT INTO transiciones_estado (id_estado_origen, id_estado_destino, id_permiso, requiere_motivo, requiere_confirmacion_solicitante, automatica)
SELECT origen.id_estado, destino.id_estado, p.id_permiso, true, false, true
FROM estados_ticket origen CROSS JOIN estados_ticket destino CROSS JOIN permisos p
WHERE origen.codigo IN ('NUEVO', 'ASIGNADO', 'EN_ATENCION', 'REABIERTO') AND destino.codigo = 'ESCALADO' AND p.codigo = 'ticket.escalar'
ON CONFLICT (id_estado_origen, id_estado_destino, automatica) DO NOTHING;
UPDATE tareas_programadas SET activa = true WHERE codigo IN ('sla-threshold', 'sla-breach-escalation', 'auto-close-resolved', 'mail-ingest', 'notification-dispatch', 'audit-chain-verify');
-- Down Migration
UPDATE tareas_programadas SET activa = false;
DELETE FROM transiciones_estado WHERE automatica AND id_estado_destino = (SELECT id_estado FROM estados_ticket WHERE codigo = 'ESCALADO');
DROP INDEX idx_notificaciones_reintento;
ALTER TABLE notificaciones DROP CONSTRAINT uq_notificacion_evento, DROP COLUMN id_bitacora, DROP COLUMN proximo_intento;
