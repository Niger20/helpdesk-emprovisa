-- Up Migration
CREATE TABLE articulos_kb (
  id_articulo serial NOT NULL,
  titulo varchar(150) NOT NULL,
  resumen varchar(300),
  contenido text NOT NULL,
  id_categoria int NOT NULL,
  id_autor int NOT NULL,
  id_revisor int,
  estado varchar(12) NOT NULL,
  visibilidad varchar(12) NOT NULL,
  version_actual int NOT NULL,
  publicado_en timestamptz,
  total_vistas int NOT NULL,
  PRIMARY KEY (id_articulo)
);

CREATE TABLE articulos_kb_versiones (
  id_version serial NOT NULL,
  id_articulo int NOT NULL,
  numero_version int NOT NULL,
  titulo varchar(150) NOT NULL,
  contenido text NOT NULL,
  editado_por int NOT NULL,
  fecha_edicion timestamptz NOT NULL,
  motivo_cambio varchar(200),
  PRIMARY KEY (id_version)
);

CREATE TABLE kb_votos (
  id_articulo int NOT NULL,
  id_usuario int NOT NULL,
  util boolean NOT NULL,
  comentario varchar(300),
  fecha timestamptz NOT NULL,
  PRIMARY KEY (id_articulo, id_usuario)
);

-- Down Migration
DROP TABLE kb_votos;
DROP TABLE articulos_kb_versiones;
DROP TABLE articulos_kb;
