-- Up Migration
CREATE TABLE bitacora (
  id_bitacora bigserial NOT NULL,
  id_ticket int NOT NULL,
  id_usuario int,
  id_sesion uuid,
  id_tarea int,
  accion varchar(40) NOT NULL,
  campo_afectado varchar(60),
  valor_anterior jsonb,
  valor_nuevo jsonb,
  fecha_hora timestamptz NOT NULL,
  direccion_ip inet,
  automatica boolean NOT NULL,
  hash_previo char(64) NOT NULL,
  hash_registro char(64) NOT NULL UNIQUE,
  PRIMARY KEY (id_bitacora)
);

CREATE TABLE auditoria_sistema (
  id_auditoria bigserial NOT NULL,
  id_usuario int,
  id_sesion uuid,
  id_tarea int,
  accion varchar(40) NOT NULL,
  entidad varchar(50) NOT NULL,
  id_entidad varchar(40),
  detalle jsonb,
  resultado varchar(10) NOT NULL,
  direccion_ip inet,
  fecha_hora timestamptz NOT NULL,
  hash_previo char(64) NOT NULL,
  hash_registro char(64) NOT NULL UNIQUE,
  PRIMARY KEY (id_auditoria)
);

-- Down Migration
DROP TABLE auditoria_sistema;
DROP TABLE bitacora;
