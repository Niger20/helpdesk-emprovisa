-- Up Migration
DROP INDEX uq_admin_emergencia_local;
INSERT INTO permisos (codigo, modulo, accion) VALUES ('auth.sesion', 'auth', 'sesion') ON CONFLICT (codigo) DO NOTHING;
INSERT INTO rol_permiso (id_rol, id_permiso)
  SELECT r.id_rol, p.id_permiso FROM roles r CROSS JOIN permisos p WHERE p.codigo = 'auth.sesion'
  ON CONFLICT DO NOTHING;
INSERT INTO parametros (clave, valor, tipo_dato, descripcion, modificado_en)
  VALUES ('login.bloqueo_minutos', '15', 'ENTERO', 'Bloqueo temporal del prototipo tras cinco fallos', now())
  ON CONFLICT (clave) DO NOTHING;
CREATE INDEX idx_intentos_username_fecha ON intentos_login (username_intentado, fecha_hora);
CREATE INDEX idx_sesiones_usuario ON sesiones (id_usuario);

UPDATE usuarios SET origen_cuenta = 'LOCAL', guid_directorio = NULL,
  password_hash = (SELECT password_hash FROM usuarios WHERE username = 'admin.emergencia'), sincronizado_en = NULL
  WHERE origen_cuenta = 'AD' AND guid_directorio::text LIKE '00000000-0000-4000-8000-%'
    AND EXISTS (SELECT 1 FROM parametros WHERE clave = 'demo.seed.version' AND valor = '1');
UPDATE tareas_programadas SET activa = false WHERE codigo = 'ad-sync';

-- Down Migration
DROP INDEX idx_sesiones_usuario, idx_intentos_username_fecha;
DELETE FROM parametros WHERE clave = 'login.bloqueo_minutos';
