import { sql } from 'kysely';
import type { Database, DatabaseExecutor } from '../../../infra/db/client.js';
import type { CalendarInput, CalendarQuery } from '@helpdesk/contracts';
import type { SessionContext } from '../../auth/index.js';

function queries(executor: DatabaseExecutor) {
  return {
    find: (id: number, lock = false) => {
      const query = executor.selectFrom('calendariosLaborales').selectAll().where('idCalendario', '=', id);
      return (lock ? query.forUpdate() : query).executeTakeFirst();
    },
    hours: (id: number) => executor.selectFrom('horariosLaborales').select(['diaSemana', 'horaInicio', 'horaFin']).where('idCalendario', '=', id).orderBy('diaSemana').orderBy('horaInicio').execute(),
    holidays: (id: number) => executor.selectFrom('feriados').select(['fecha', 'descripcion']).where('idCalendario', '=', id).orderBy('fecha').execute(),
    sites: (id?: number) => { let query = executor.selectFrom('sedes').select(['idSede', 'nombre', 'idCalendario']).where('activa', '=', true);
      if (id !== undefined) query = query.where('idCalendario', '=', id); return query.orderBy('nombre').execute(); },
    site: (id: number) => executor.selectFrom('sedes').select(['idSede', 'idCalendario']).where('idSede', '=', id).where('activa', '=', true).forUpdate().executeTakeFirst(),
    missing: async (id: number) => (await sql<{ total: string }>`select count(*) as total from tickets t join sedes s on s.id_sede=t.id_sede
      where s.id_calendario=${id} and not exists (select 1 from bitacora b where b.id_ticket=t.id_ticket and b.accion='SLA_CALENDARIO_FIJADO'
      and b.valor_nuevo @> jsonb_build_object('ciclo',t.numero_reaperturas+1))`.execute(executor)).rows[0]?.total !== '0',
    list: async (query: CalendarQuery) => ({ rows: await executor.selectFrom('calendariosLaborales').select('idCalendario').orderBy('nombre').orderBy('idCalendario')
      .offset((query.page - 1) * query.pageSize).limit(query.pageSize).execute(),
    total: Number((await executor.selectFrom('calendariosLaborales').select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow()).total) }),
    insert: (data: CalendarInput) => executor.insertInto('calendariosLaborales').values({ nombre: data.nombre, zonaHoraria: data.zonaHoraria }).returning('idCalendario').executeTakeFirstOrThrow(),
    replace: async (id: number, data: CalendarInput) => {
      await executor.updateTable('calendariosLaborales').set({ nombre: data.nombre, zonaHoraria: data.zonaHoraria }).where('idCalendario', '=', id).execute();
      await executor.deleteFrom('horariosLaborales').where('idCalendario', '=', id).execute();
      await executor.deleteFrom('feriados').where('idCalendario', '=', id).execute();
      await executor.insertInto('horariosLaborales').values(data.horarios.map((hour) => ({ idCalendario: id, ...hour }))).execute();
      if (data.feriados.length) await executor.insertInto('feriados').values(data.feriados.map((day) => ({ idCalendario: id, ...day }))).execute();
    },
    bind: (idSede: number, idCalendario: number) => executor.updateTable('sedes').set({ idCalendario }).where('idSede', '=', idSede).execute(),
    audit: (context: SessionContext, id: number, action: string, before: CalendarInput | number | null, after: CalendarInput | number, now: Date) => executor.insertInto('auditoriaSistema')
      .values({ entidad: action === 'CALENDARIO_SEDE' ? 'sedes' : 'calendarios_laborales', idEntidad: String(id), accion: action, detalle: { anterior: before, nuevo: after },
        idUsuario: context.usuario.idUsuario, idSesion: context.idSesion, direccionIp: context.direccionIp ?? null, fechaHora: now, resultado: 'EXITO', hashPrevio: '', hashRegistro: '' }).execute(),
  };
}
export function createCalendarsRepository(database: Database) {
  return { ...queries(database), atomic: <T>(action: (repo: ReturnType<typeof queries>) => Promise<T>) => database.transaction().execute(async (trx) => {
    await sql`select pg_advisory_xact_lock(2026020, 1)`.execute(trx); return action(queries(trx));
  }) };
}
export type CalendarsRepository = ReturnType<typeof createCalendarsRepository>;
