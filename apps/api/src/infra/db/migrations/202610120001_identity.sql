-- Up Migration
CREATE TABLE sedes (
  id_sede serial NOT NULL,
  codigo varchar(10) NOT NULL UNIQUE,
  nombre varchar(50) NOT NULL,
  ciudad varchar(50) NOT NULL,
  direccion varchar(150),
  id_calendario int NOT NULL,
  activa boolean NOT NULL,
  PRIMARY KEY (id_sede)
);

CREATE TABLE departamentos (
  id_departamento serial NOT NULL,
  id_sede int NOT NULL,
  nombre varchar(80) NOT NULL,
  PRIMARY KEY (id_departamento)
);

CREATE TABLE usuarios (
  id_usuario serial NOT NULL,
  username varchar(50) NOT NULL UNIQUE,
  guid_directorio uuid UNIQUE,
  nombre_completo varchar(100) NOT NULL,
  correo varchar(120) NOT NULL UNIQUE,
  cargo varchar(80),
  extension varchar(10),
  id_sede int NOT NULL,
  id_departamento int,
  id_jefe_inmediato int,
  origen_cuenta varchar(10) NOT NULL,
  password_hash varchar(255),
  estado varchar(10) NOT NULL,
  intentos_fallidos smallint NOT NULL,
  bloqueado_hasta timestamptz,
  ultimo_acceso timestamptz,
  sincronizado_en timestamptz,
  PRIMARY KEY (id_usuario)
);

CREATE TABLE roles (
  id_rol serial NOT NULL,
  codigo varchar(30) NOT NULL UNIQUE,
  nombre varchar(60) NOT NULL,
  descripcion varchar(200),
  es_sistema boolean NOT NULL,
  PRIMARY KEY (id_rol)
);

CREATE TABLE permisos (
  id_permiso serial NOT NULL,
  codigo varchar(60) NOT NULL UNIQUE,
  modulo varchar(30) NOT NULL,
  accion varchar(30) NOT NULL,
  descripcion varchar(200),
  PRIMARY KEY (id_permiso)
);

CREATE TABLE rol_permiso (
  id_rol int NOT NULL,
  id_permiso int NOT NULL,
  PRIMARY KEY (id_rol, id_permiso)
);

CREATE TABLE usuario_rol (
  id_usuario_rol serial NOT NULL,
  id_usuario int NOT NULL,
  id_rol int NOT NULL,
  id_sede_alcance int,
  vigente_desde date NOT NULL,
  vigente_hasta date,
  asignado_por int NOT NULL,
  PRIMARY KEY (id_usuario_rol)
);

CREATE TABLE grupos_resolutores (
  id_grupo serial NOT NULL,
  nombre varchar(80) NOT NULL,
  nivel smallint NOT NULL,
  id_sede int,
  correo_grupo varchar(120),
  activo boolean NOT NULL,
  PRIMARY KEY (id_grupo)
);

CREATE TABLE grupo_miembros (
  id_grupo int NOT NULL,
  id_usuario int NOT NULL,
  es_coordinador boolean NOT NULL,
  desde date NOT NULL,
  hasta date,
  PRIMARY KEY (id_grupo, id_usuario)
);

CREATE TABLE usuario_especialidad (
  id_usuario int NOT NULL,
  id_categoria int NOT NULL,
  nivel_dominio smallint NOT NULL,
  PRIMARY KEY (id_usuario, id_categoria)
);

CREATE TABLE delegaciones (
  id_delegacion serial NOT NULL,
  id_delegante int NOT NULL,
  id_delegado int NOT NULL,
  desde timestamptz NOT NULL,
  hasta timestamptz NOT NULL,
  motivo varchar(200) NOT NULL,
  aprobada_por int NOT NULL,
  PRIMARY KEY (id_delegacion)
);

CREATE TABLE sesiones (
  id_sesion uuid NOT NULL,
  id_usuario int NOT NULL,
  token_hash char(64) NOT NULL UNIQUE,
  direccion_ip inet NOT NULL,
  user_agent varchar(255),
  creada_en timestamptz NOT NULL,
  ultima_actividad timestamptz NOT NULL,
  expira_en timestamptz NOT NULL,
  revocada_en timestamptz,
  motivo_revocacion varchar(60),
  PRIMARY KEY (id_sesion)
);

CREATE TABLE intentos_login (
  id_intento bigserial NOT NULL,
  id_usuario int,
  username_intentado varchar(50) NOT NULL,
  direccion_ip inet NOT NULL,
  exitoso boolean NOT NULL,
  motivo_fallo varchar(40),
  fecha_hora timestamptz NOT NULL,
  PRIMARY KEY (id_intento)
);

-- Down Migration
DROP TABLE intentos_login;
DROP TABLE sesiones;
DROP TABLE delegaciones;
DROP TABLE usuario_especialidad;
DROP TABLE grupo_miembros;
DROP TABLE grupos_resolutores;
DROP TABLE usuario_rol;
DROP TABLE rol_permiso;
DROP TABLE permisos;
DROP TABLE roles;
DROP TABLE usuarios;
DROP TABLE departamentos;
DROP TABLE sedes;
