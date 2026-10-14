-- Up Migration
CREATE TABLE categorias (
  id_categoria serial NOT NULL,
  id_padre int,
  nombre varchar(80) NOT NULL,
  tipo_aplicable varchar(10) NOT NULL,
  requiere_activo boolean NOT NULL,
  id_grupo_default int,
  orden smallint NOT NULL,
  activa boolean NOT NULL,
  PRIMARY KEY (id_categoria)
);

CREATE TABLE estados_ticket (
  id_estado serial NOT NULL,
  codigo varchar(20) NOT NULL UNIQUE,
  nombre varchar(40) NOT NULL,
  es_final boolean NOT NULL,
  reloj_corre boolean NOT NULL,
  orden smallint NOT NULL,
  PRIMARY KEY (id_estado)
);

CREATE TABLE transiciones_estado (
  id_transicion serial NOT NULL,
  id_estado_origen int NOT NULL,
  id_estado_destino int NOT NULL,
  id_permiso int NOT NULL,
  requiere_motivo boolean NOT NULL,
  requiere_confirmacion_solicitante boolean NOT NULL,
  automatica boolean NOT NULL,
  PRIMARY KEY (id_transicion)
);

CREATE TABLE prioridades_sla (
  id_prioridad serial NOT NULL,
  codigo char(2) NOT NULL UNIQUE,
  nombre varchar(30) NOT NULL,
  minutos_respuesta int NOT NULL,
  minutos_solucion int NOT NULL,
  modo_calendario varchar(10) NOT NULL,
  porcentaje_alerta smallint NOT NULL,
  color_hex char(7) NOT NULL,
  activa boolean NOT NULL,
  PRIMARY KEY (id_prioridad)
);

CREATE TABLE matriz_prioridad (
  id_matriz serial NOT NULL,
  impacto varchar(10) NOT NULL,
  urgencia varchar(10) NOT NULL,
  id_prioridad int NOT NULL,
  PRIMARY KEY (id_matriz)
);

CREATE TABLE calendarios_laborales (
  id_calendario serial NOT NULL,
  nombre varchar(60) NOT NULL,
  zona_horaria varchar(40) NOT NULL,
  PRIMARY KEY (id_calendario)
);

CREATE TABLE horarios_laborales (
  id_horario serial NOT NULL,
  id_calendario int NOT NULL,
  dia_semana smallint NOT NULL,
  hora_inicio time NOT NULL,
  hora_fin time NOT NULL,
  PRIMARY KEY (id_horario)
);

CREATE TABLE feriados (
  id_feriado serial NOT NULL,
  id_calendario int NOT NULL,
  fecha date NOT NULL,
  descripcion varchar(100) NOT NULL,
  PRIMARY KEY (id_feriado)
);

CREATE TABLE parametros (
  clave varchar(60) NOT NULL,
  valor text NOT NULL,
  tipo_dato varchar(15) NOT NULL,
  descripcion varchar(200),
  modificado_por int,
  modificado_en timestamptz NOT NULL,
  PRIMARY KEY (clave)
);

CREATE TABLE plantillas_notificacion (
  id_plantilla serial NOT NULL,
  codigo_evento varchar(40) NOT NULL UNIQUE,
  asunto varchar(150) NOT NULL,
  cuerpo text NOT NULL,
  activa boolean NOT NULL,
  PRIMARY KEY (id_plantilla)
);

CREATE TABLE tareas_programadas (
  id_tarea serial NOT NULL,
  codigo varchar(40) NOT NULL UNIQUE,
  expresion_cron varchar(50) NOT NULL,
  ultima_ejecucion timestamptz,
  ultimo_resultado varchar(20),
  activa boolean NOT NULL,
  PRIMARY KEY (id_tarea)
);

-- Down Migration
DROP TABLE tareas_programadas;
DROP TABLE plantillas_notificacion;
DROP TABLE parametros;
DROP TABLE feriados;
DROP TABLE horarios_laborales;
DROP TABLE calendarios_laborales;
DROP TABLE matriz_prioridad;
DROP TABLE prioridades_sla;
DROP TABLE transiciones_estado;
DROP TABLE estados_ticket;
DROP TABLE categorias;
