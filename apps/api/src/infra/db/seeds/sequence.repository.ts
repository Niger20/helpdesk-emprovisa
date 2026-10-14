import { sql } from 'kysely';
import type { SeedTransaction } from './context.js';

export async function syncSequences(trx: SeedTransaction) {
  const columns: [string, string][] = [
    ['calendarios_laborales', 'id_calendario'], ['sedes', 'id_sede'], ['departamentos', 'id_departamento'],
    ['roles', 'id_rol'], ['grupos_resolutores', 'id_grupo'], ['categorias', 'id_categoria'],
    ['estados_ticket', 'id_estado'], ['prioridades_sla', 'id_prioridad'], ['permisos', 'id_permiso'],
    ['usuarios', 'id_usuario'], ['tipos_activo', 'id_tipo_activo'], ['activos_ti', 'id_activo'],
    ['tickets', 'id_ticket'], ['articulos_kb', 'id_articulo'], ['tareas_programadas', 'id_tarea'],
    ['plantillas_notificacion', 'id_plantilla'],
  ];
  for (const [table, column] of columns) {
    await sql`select setval(pg_get_serial_sequence(${table}, ${column}),
      (select max(${sql.id(column)}) from ${sql.id(table)}), true)`.execute(trx);
  }
}
