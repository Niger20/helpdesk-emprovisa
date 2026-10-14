-- Up Migration
CREATE TABLE tipos_activo (
  id_tipo_activo serial NOT NULL,
  nombre varchar(60) NOT NULL UNIQUE,
  familia varchar(20) NOT NULL,
  PRIMARY KEY (id_tipo_activo)
);

CREATE TABLE activos_ti (
  id_activo serial NOT NULL,
  codigo_patrimonial varchar(20) NOT NULL UNIQUE,
  id_tipo_activo int NOT NULL,
  marca varchar(50),
  modelo varchar(80),
  numero_serie varchar(60),
  descripcion text NOT NULL,
  id_sede int NOT NULL,
  id_custodio int,
  estado varchar(15) NOT NULL,
  acta_numero varchar(30) NOT NULL,
  fecha_adquisicion date,
  garantia_hasta date,
  PRIMARY KEY (id_activo)
);

CREATE TABLE activo_custodia_historial (
  id_custodia serial NOT NULL,
  id_activo int NOT NULL,
  id_usuario int NOT NULL,
  desde date NOT NULL,
  hasta date,
  acta_numero varchar(30) NOT NULL,
  registrado_por int NOT NULL,
  PRIMARY KEY (id_custodia)
);

-- Down Migration
DROP TABLE activo_custodia_historial;
DROP TABLE activos_ti;
DROP TABLE tipos_activo;
