import pg from 'pg';
import { describe, expect, it } from 'vitest';

export function auditChecks(app: pg.Pool, readonly: pg.Pool) {
  describe('Evidencia inmutable y concurrente', () => {
    it('la cadena de la seed verifica para ambas tablas', async () => {
      const result = await readonly.query<{ bitacora: boolean; auditoria: boolean }>(
        'SELECT verificar_cadena_bitacora() AS bitacora, verificar_cadena_auditoria() AS auditoria',
      );
      expect(result.rows[0]).toEqual({ bitacora: true, auditoria: true });
    });
    it.each(['bitacora', 'auditoria_sistema'])('app carece de UPDATE, DELETE y TRUNCATE en %s', async (table) => {
      const result = await app.query<{ update: boolean; delete: boolean; truncate: boolean }>(
        "SELECT has_table_privilege(current_user, $1, 'UPDATE') AS update, has_table_privilege(current_user, $1, 'DELETE') AS delete, has_table_privilege(current_user, $1, 'TRUNCATE') AS truncate", [table],
      );
      expect(result.rows[0]).toEqual({ update: false, delete: false, truncate: false });
    });
    it('rechaza modificar o borrar la bitácora', async () => {
      await expect(app.query("UPDATE bitacora SET accion = 'ALTERADA'" )).rejects.toMatchObject({ code: '42501' });
      await expect(app.query('DELETE FROM bitacora')).rejects.toMatchObject({ code: '42501' });
    });
    it('encadena inserciones concurrentes sin depender del orden del id', async () => {
      const clients = new pg.Pool({ ...app.options, max: 4 });
      try {
        await Promise.all(Array.from({ length: 8 }, (_, index) => clients.query(
          "INSERT INTO bitacora (id_ticket, id_tarea, accion, fecha_hora, automatica, hash_previo, hash_registro) VALUES (1, 7, $1, now(), true, 'ignorado', 'ignorado')", [`PRUEBA_${index}`],
        )));
        const result = await readonly.query<{ valida: boolean }>('SELECT verificar_cadena_bitacora() AS valida');
        expect(result.rows[0]?.valida).toBe(true);
      } finally { await clients.end(); }
    });
  });
}
