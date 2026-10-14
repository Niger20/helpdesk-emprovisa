-- Up Migration
INSERT INTO transiciones_estado (id_estado_origen, id_estado_destino, id_permiso, requiere_motivo, requiere_confirmacion_solicitante, automatica)
SELECT origen.id_estado, destino.id_estado, p.id_permiso, false, false, true
FROM estados_ticket origen CROSS JOIN estados_ticket destino CROSS JOIN permisos p
WHERE origen.codigo = 'NUEVO' AND destino.codigo = 'ASIGNADO' AND p.codigo = 'ticket.asignar'
ON CONFLICT (id_estado_origen, id_estado_destino, automatica) DO NOTHING;
INSERT INTO tareas_programadas (codigo, expresion_cron, activa)
SELECT 'ticket-auto-assignment', '* * * * *', true WHERE EXISTS (SELECT 1 FROM parametros WHERE clave = 'demo.seed.version')
ON CONFLICT (codigo) DO NOTHING;
SELECT helpdesk_queue.create_queue_install('ticket-auto-assignment', '{"policy":"standard","retryLimit":5,"retryDelay":60,"retryBackoff":true}'::jsonb);
-- Down Migration
DELETE FROM transiciones_estado WHERE automatica AND id_estado_origen = (SELECT id_estado FROM estados_ticket WHERE codigo = 'NUEVO')
  AND id_estado_destino = (SELECT id_estado FROM estados_ticket WHERE codigo = 'ASIGNADO');
UPDATE tareas_programadas SET activa = false WHERE codigo = 'ticket-auto-assignment';
