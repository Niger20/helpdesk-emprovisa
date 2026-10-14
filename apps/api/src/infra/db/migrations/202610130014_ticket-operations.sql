-- Up Migration
INSERT INTO permisos (codigo, modulo, accion)
SELECT v.codigo, 'ticket', v.accion FROM (VALUES
 ('ticket.reasignar', 'reasignar'), ('ticket.comentar_interno', 'comentar_interno')
) AS v(codigo, accion) WHERE EXISTS (SELECT 1 FROM roles) ON CONFLICT (codigo) DO NOTHING;
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso FROM roles r CROSS JOIN permisos p WHERE
 (r.codigo = 'JEFE_TI' AND p.codigo IN ('ticket.reasignar', 'ticket.comentar_interno')) OR
 (r.codigo IN ('ANALISTA_N1', 'ESPECIALISTA_N2') AND p.codigo = 'ticket.comentar_interno') ON CONFLICT DO NOTHING;

-- Down Migration
DELETE FROM rol_permiso WHERE id_permiso IN (SELECT id_permiso FROM permisos WHERE codigo IN ('ticket.reasignar', 'ticket.comentar_interno'));
DELETE FROM permisos WHERE codigo IN ('ticket.reasignar', 'ticket.comentar_interno');
