-- Up Migration
INSERT INTO bitacora (id_ticket, accion, campo_afectado, valor_nuevo, fecha_hora, automatica, hash_previo, hash_registro)
SELECT t.id_ticket, 'SLA_CALENDARIO_FIJADO', 'calendario_sla',
  jsonb_build_object('ciclo', t.numero_reaperturas + 1, 'calendario', jsonb_build_object(
    'zonaHoraria', c.zona_horaria,
    'horarios', COALESCE((SELECT jsonb_agg(jsonb_build_object('diaSemana', h.dia_semana, 'horaInicio', to_char(h.hora_inicio, 'HH24:MI'), 'horaFin', to_char(h.hora_fin, 'HH24:MI')) ORDER BY h.dia_semana, h.hora_inicio) FROM horarios_laborales h WHERE h.id_calendario = c.id_calendario), '[]'::jsonb),
    'feriados', COALESCE((SELECT jsonb_agg(to_char(f.fecha, 'YYYY-MM-DD') ORDER BY f.fecha) FROM feriados f WHERE f.id_calendario = c.id_calendario), '[]'::jsonb))),
  now(), true, '', ''
FROM tickets t JOIN sedes s ON s.id_sede = t.id_sede JOIN calendarios_laborales c ON c.id_calendario = s.id_calendario
WHERE NOT EXISTS (SELECT 1 FROM bitacora b WHERE b.id_ticket = t.id_ticket AND b.accion = 'SLA_CALENDARIO_FIJADO' AND b.valor_nuevo @> jsonb_build_object('ciclo', t.numero_reaperturas + 1))
ORDER BY t.id_ticket;
CREATE INDEX idx_bitacora_calendario_sla ON bitacora (id_ticket, id_bitacora DESC) WHERE accion = 'SLA_CALENDARIO_FIJADO';
-- Down Migration
DROP INDEX idx_bitacora_calendario_sla;
-- Las fotografías y su evidencia encadenada se conservan.
