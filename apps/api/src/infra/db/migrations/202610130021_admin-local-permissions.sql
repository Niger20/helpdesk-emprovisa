-- Up Migration
WITH nuevos AS (
  INSERT INTO rol_permiso (id_rol, id_permiso)
  SELECT r.id_rol, p.id_permiso FROM roles r CROSS JOIN permisos p
  WHERE r.codigo = 'JEFE_TI' AND p.codigo IN ('ticket.ver_propios', 'ticket.ver_sede')
  ON CONFLICT (id_rol, id_permiso) DO NOTHING
  RETURNING id_rol
)
INSERT INTO auditoria_sistema (accion, entidad, detalle, fecha_hora, resultado, hash_previo, hash_registro)
SELECT 'PERMISOS_ADMIN_DEMO_ACTUALIZADOS', 'rol_permiso',
  jsonb_build_object('rol', 'JEFE_TI', 'permisos', jsonb_build_array('ticket.ver_propios', 'ticket.ver_sede'), 'agregados', count(*)),
  now(), 'EXITO', '', '' FROM nuevos HAVING count(*) > 0;
-- Down Migration
-- Los permisos válidos del rol y la evidencia inmutable se conservan al revertir.
