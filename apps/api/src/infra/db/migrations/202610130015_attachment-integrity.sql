-- Up Migration
ALTER TABLE ticket_adjuntos ADD COLUMN hash_sha256 char(64) NOT NULL;
ALTER TABLE ticket_adjuntos ADD CONSTRAINT ck_adjunto_hash CHECK (hash_sha256 ~ '^[a-f0-9]{64}$');
INSERT INTO parametros (clave, valor, tipo_dato, descripcion, modificado_en)
VALUES ('adjunto.maximo_bytes', '10485760', 'ENTERO', 'Máximo local por archivo JPG, PNG o PDF', now())
ON CONFLICT (clave) DO NOTHING;

-- Down Migration
DELETE FROM parametros WHERE clave = 'adjunto.maximo_bytes';
ALTER TABLE ticket_adjuntos DROP CONSTRAINT ck_adjunto_hash;
ALTER TABLE ticket_adjuntos DROP COLUMN hash_sha256;
