-- Up Migration
INSERT INTO permisos (codigo, modulo, accion) VALUES
('ticket.ver_propios','ticket','ver_propios'), ('ticket.ver_sede','ticket','ver_sede'),
('ticket.ver_grupo','ticket','ver_grupo'), ('ticket.ver_todos','ticket','ver_todos'),
('ticket.registrar_tercero','ticket','registrar_tercero'), ('ticket.ver_notas_internas','ticket','ver_notas_internas') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso FROM roles r CROSS JOIN permisos p WHERE
 (r.codigo IN ('SOLICITANTE','ANALISTA_N1','ESPECIALISTA_N2') AND p.codigo = 'ticket.ver_propios') OR
 (r.codigo = 'ANALISTA_N1' AND p.codigo IN ('ticket.ver_sede','ticket.registrar_tercero','ticket.ver_notas_internas')) OR
 (r.codigo = 'ESPECIALISTA_N2' AND p.codigo IN ('ticket.ver_grupo','ticket.registrar_tercero','ticket.ver_notas_internas')) OR
 (r.codigo = 'JEFE_TI' AND p.codigo IN ('ticket.ver_todos','ticket.registrar_tercero','ticket.ver_notas_internas')) OR
 (r.codigo = 'AUDITOR' AND p.codigo IN ('ticket.ver_todos','ticket.ver_notas_internas')) ON CONFLICT DO NOTHING;

-- Down Migration
DELETE FROM rol_permiso WHERE id_permiso IN (SELECT id_permiso FROM permisos WHERE accion IN ('ver_propios','ver_sede','ver_grupo','ver_todos','registrar_tercero','ver_notas_internas'));
DELETE FROM permisos WHERE accion IN ('ver_propios','ver_sede','ver_grupo','ver_todos','registrar_tercero','ver_notas_internas');
