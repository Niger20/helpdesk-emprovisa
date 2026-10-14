-- Up Migration
SELECT helpdesk_queue.create_queue('__pgboss__send-it', '{"policy":"standard","retryLimit":5,"retryDelay":60,"retryBackoff":true}'::jsonb);
ALTER FUNCTION helpdesk_queue.create_queue(text, jsonb) RENAME TO create_queue_install;
CREATE FUNCTION helpdesk_queue.create_queue(queue_name text, options jsonb) RETURNS void
LANGUAGE plpgsql SET search_path = helpdesk_queue, pg_temp AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM helpdesk_queue.queue WHERE name = queue_name) THEN RETURN; END IF;
  RAISE EXCEPTION 'Las colas se crean mediante migraciones' USING ERRCODE = '42501';
END;
$$;
REVOKE ALL ON FUNCTION helpdesk_queue.create_queue(text, jsonb), helpdesk_queue.create_queue_install(text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION helpdesk_queue.create_queue_install(text, jsonb) FROM helpdesk_app;
GRANT EXECUTE ON FUNCTION helpdesk_queue.create_queue(text, jsonb) TO helpdesk_app;
-- Down Migration
DROP FUNCTION helpdesk_queue.create_queue(text, jsonb);
ALTER FUNCTION helpdesk_queue.create_queue_install(text, jsonb) RENAME TO create_queue;
