-- Up Migration
CREATE TABLE tickets (
  id_ticket serial NOT NULL,
  numero varchar(12) NOT NULL UNIQUE,
  tipo varchar(10) NOT NULL,
  titulo varchar(150) NOT NULL,
  descripcion text NOT NULL,
  id_solicitante int NOT NULL,
  id_registrado_por int NOT NULL,
  id_asignado int,
  id_grupo int,
  id_sede int NOT NULL,
  id_categoria int NOT NULL,
  id_activo int,
  impacto varchar(10) NOT NULL,
  urgencia varchar(10) NOT NULL,
  id_prioridad int NOT NULL,
  prioridad_manual boolean NOT NULL,
  justificacion_prioridad text,
  id_estado int NOT NULL,
  canal_ingreso varchar(20) NOT NULL,
  id_ticket_origen int,
  numero_reaperturas smallint NOT NULL,
  fecha_creacion timestamptz NOT NULL,
  fecha_limite_respuesta timestamptz NOT NULL,
  fecha_limite_solucion timestamptz NOT NULL,
  fecha_primera_respuesta timestamptz,
  fecha_resolucion timestamptz,
  fecha_cierre timestamptz,
  minutos_pausa int NOT NULL,
  sla_respuesta_cumplido boolean,
  sla_solucion_cumplido boolean,
  version int NOT NULL,
  PRIMARY KEY (id_ticket)
);

CREATE TABLE ticket_asignaciones (
  id_asignacion serial NOT NULL,
  id_ticket int NOT NULL,
  id_usuario int,
  id_grupo int,
  tipo varchar(15) NOT NULL,
  asignado_por int,
  motivo varchar(200),
  desde timestamptz NOT NULL,
  hasta timestamptz,
  PRIMARY KEY (id_asignacion)
);

CREATE TABLE ticket_escalamientos (
  id_escalamiento serial NOT NULL,
  id_ticket int NOT NULL,
  nivel_origen smallint NOT NULL,
  nivel_destino smallint NOT NULL,
  id_grupo_destino int NOT NULL,
  tipo varchar(10) NOT NULL,
  motivo varchar(200) NOT NULL,
  escalado_por int,
  fecha timestamptz NOT NULL,
  aceptado_por int,
  aceptado_en timestamptz,
  PRIMARY KEY (id_escalamiento)
);

CREATE TABLE ticket_comentarios (
  id_comentario serial NOT NULL,
  id_ticket int NOT NULL,
  id_autor int,
  visibilidad varchar(10) NOT NULL,
  contenido text NOT NULL,
  origen varchar(10) NOT NULL,
  id_correo bigint,
  fecha_creacion timestamptz NOT NULL,
  PRIMARY KEY (id_comentario)
);

CREATE TABLE ticket_adjuntos (
  id_adjunto serial NOT NULL,
  id_ticket int NOT NULL,
  id_comentario int,
  nombre_original varchar(200) NOT NULL,
  nombre_almacenado uuid NOT NULL UNIQUE,
  mime_type varchar(100) NOT NULL,
  tamano_bytes int NOT NULL,
  estado_validacion varchar(10) NOT NULL,
  subido_por int NOT NULL,
  fecha_subida timestamptz NOT NULL,
  PRIMARY KEY (id_adjunto)
);

CREATE TABLE pausas_sla (
  id_pausa serial NOT NULL,
  id_ticket int NOT NULL,
  motivo varchar(20) NOT NULL,
  detalle varchar(250) NOT NULL,
  referencia_externa varchar(60),
  iniciada_por int NOT NULL,
  aprobada_por int,
  inicio timestamptz NOT NULL,
  fin timestamptz,
  minutos_descontados int,
  PRIMARY KEY (id_pausa)
);

CREATE TABLE sla_alertas (
  id_alerta serial NOT NULL,
  id_ticket int NOT NULL,
  ciclo_sla smallint NOT NULL,
  tipo varchar(20) NOT NULL,
  programada_para timestamptz NOT NULL,
  disparada_en timestamptz,
  estado varchar(10) NOT NULL,
  PRIMARY KEY (id_alerta)
);

CREATE TABLE ticket_reaperturas (
  id_reapertura serial NOT NULL,
  id_ticket int NOT NULL,
  solicitada_por int NOT NULL,
  motivo varchar(250) NOT NULL,
  fecha timestamptz NOT NULL,
  nuevo_limite_solucion timestamptz NOT NULL,
  PRIMARY KEY (id_reapertura)
);

CREATE TABLE ticket_resoluciones (
  id_resolucion serial NOT NULL,
  id_ticket int NOT NULL,
  ciclo smallint NOT NULL,
  id_resolutor int NOT NULL,
  causa varchar(100),
  solucion text NOT NULL,
  fecha_resolucion timestamptz NOT NULL,
  PRIMARY KEY (id_resolucion)
);

CREATE TABLE ticket_articulos (
  id_ticket int NOT NULL,
  id_articulo int NOT NULL,
  uso varchar(10) NOT NULL,
  vinculado_por int NOT NULL,
  fecha timestamptz NOT NULL,
  PRIMARY KEY (id_ticket, id_articulo)
);

CREATE TABLE encuestas_csat (
  id_encuesta serial NOT NULL,
  id_ticket int NOT NULL UNIQUE,
  token_hash char(64) NOT NULL UNIQUE,
  calificacion smallint,
  comentario varchar(500),
  enviada_en timestamptz NOT NULL,
  respondida_en timestamptz,
  expira_en timestamptz NOT NULL,
  PRIMARY KEY (id_encuesta)
);

CREATE TABLE notificaciones (
  id_notificacion bigserial NOT NULL,
  id_ticket int,
  id_destinatario int,
  id_plantilla int NOT NULL,
  correo_destino varchar(120) NOT NULL,
  asunto varchar(150) NOT NULL,
  estado varchar(10) NOT NULL,
  intentos smallint NOT NULL,
  ultimo_error varchar(250),
  encolada_en timestamptz NOT NULL,
  enviada_en timestamptz,
  PRIMARY KEY (id_notificacion)
);

CREATE TABLE correos_entrantes (
  id_correo bigserial NOT NULL,
  message_id varchar(255) NOT NULL UNIQUE,
  in_reply_to varchar(255),
  remitente varchar(120) NOT NULL,
  id_usuario_remitente int,
  asunto varchar(250) NOT NULL,
  recibido_en timestamptz NOT NULL,
  estado varchar(20) NOT NULL,
  id_ticket int,
  motivo_rechazo varchar(150),
  hash_contenido char(64) NOT NULL,
  PRIMARY KEY (id_correo)
);

-- Down Migration
DROP TABLE correos_entrantes;
DROP TABLE notificaciones;
DROP TABLE encuestas_csat;
DROP TABLE ticket_articulos;
DROP TABLE ticket_resoluciones;
DROP TABLE ticket_reaperturas;
DROP TABLE sla_alertas;
DROP TABLE pausas_sla;
DROP TABLE ticket_adjuntos;
DROP TABLE ticket_comentarios;
DROP TABLE ticket_escalamientos;
DROP TABLE ticket_asignaciones;
DROP TABLE tickets;
