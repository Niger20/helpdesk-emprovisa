-- Up Migration
CREATE UNIQUE INDEX uq_bitacora_previo ON bitacora (hash_previo);
CREATE UNIQUE INDEX uq_auditoria_previo ON auditoria_sistema (hash_previo);

CREATE FUNCTION encadenar_registro() RETURNS trigger LANGUAGE plpgsql
SET search_path = public, pg_temp SET timezone = 'UTC' AS $$
DECLARE
  previo text;
BEGIN
  PERFORM pg_advisory_xact_lock(2026002, CASE WHEN TG_TABLE_NAME = 'bitacora' THEN 1 ELSE 2 END);
  IF TG_TABLE_NAME = 'bitacora' THEN
    SELECT b.hash_registro INTO previo FROM bitacora b
      WHERE NOT EXISTS (SELECT 1 FROM bitacora siguiente WHERE siguiente.hash_previo = b.hash_registro);
  ELSE
    SELECT a.hash_registro INTO previo FROM auditoria_sistema a
      WHERE NOT EXISTS (SELECT 1 FROM auditoria_sistema siguiente WHERE siguiente.hash_previo = a.hash_registro);
  END IF;
  NEW.hash_previo := coalesce(previo, repeat('0', 64));
  NEW.hash_registro := encode(digest(NEW.hash_previo || (to_jsonb(NEW) - 'hash_previo' - 'hash_registro')::text, 'sha256'), 'hex');
  RETURN NEW;
END;
$$;
CREATE TRIGGER bitacora_encadenar BEFORE INSERT ON bitacora FOR EACH ROW EXECUTE FUNCTION encadenar_registro();
CREATE TRIGGER auditoria_encadenar BEFORE INSERT ON auditoria_sistema FOR EACH ROW EXECUTE FUNCTION encadenar_registro();

CREATE FUNCTION impedir_modificacion_evidencia() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'La evidencia es solo inserción' USING ERRCODE = '42501';
END;
$$;
CREATE TRIGGER bitacora_inmutable BEFORE UPDATE OR DELETE OR TRUNCATE ON bitacora FOR EACH STATEMENT EXECUTE FUNCTION impedir_modificacion_evidencia();
CREATE TRIGGER auditoria_inmutable BEFORE UPDATE OR DELETE OR TRUNCATE ON auditoria_sistema FOR EACH STATEMENT EXECUTE FUNCTION impedir_modificacion_evidencia();

CREATE FUNCTION verificar_cadena_bitacora() RETURNS boolean LANGUAGE sql
SET search_path = public, pg_temp SET timezone = 'UTC' AS $$
  WITH RECURSIVE cadena AS (
    SELECT b.hash_registro FROM bitacora b WHERE b.hash_previo = repeat('0', 64)
    UNION
    SELECT b.hash_registro FROM bitacora b JOIN cadena c ON b.hash_previo = c.hash_registro
  )
  SELECT (SELECT count(*) FROM cadena) = count(*) AND coalesce(bool_and(
    hash_registro = encode(digest(hash_previo || (to_jsonb(b) - 'hash_previo' - 'hash_registro')::text, 'sha256'), 'hex')
  ), true) FROM bitacora b;
$$;
CREATE FUNCTION verificar_cadena_auditoria() RETURNS boolean LANGUAGE sql
SET search_path = public, pg_temp SET timezone = 'UTC' AS $$
  WITH RECURSIVE cadena AS (
    SELECT a.hash_registro FROM auditoria_sistema a WHERE a.hash_previo = repeat('0', 64)
    UNION
    SELECT a.hash_registro FROM auditoria_sistema a JOIN cadena c ON a.hash_previo = c.hash_registro
  )
  SELECT (SELECT count(*) FROM cadena) = count(*) AND coalesce(bool_and(
    hash_registro = encode(digest(hash_previo || (to_jsonb(a) - 'hash_previo' - 'hash_registro')::text, 'sha256'), 'hex')
  ), true) FROM auditoria_sistema a;
$$;
REVOKE ALL ON FUNCTION encadenar_registro(), impedir_modificacion_evidencia() FROM PUBLIC;
REVOKE ALL ON FUNCTION verificar_cadena_bitacora(), verificar_cadena_auditoria() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verificar_cadena_bitacora(), verificar_cadena_auditoria() TO helpdesk_app, helpdesk_readonly;

-- Down Migration
DROP TRIGGER bitacora_inmutable ON bitacora;
DROP TRIGGER auditoria_inmutable ON auditoria_sistema;
DROP TRIGGER bitacora_encadenar ON bitacora;
DROP TRIGGER auditoria_encadenar ON auditoria_sistema;
DROP FUNCTION verificar_cadena_bitacora(), verificar_cadena_auditoria(), encadenar_registro(), impedir_modificacion_evidencia();
DROP INDEX uq_bitacora_previo, uq_auditoria_previo;
