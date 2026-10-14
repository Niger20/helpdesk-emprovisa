import { sql } from 'kysely';
import { DateTime } from 'luxon';
import type { AuditQuery, ReportsQuery, ReportsFormat } from '@helpdesk/contracts';
import type { Database } from '../../infra/db/client.js';
import type { SessionContext } from '../auth/index.js';

export function createAuditRepository(database: Database) {
  return {
    list: (query: AuditQuery, sedes: number[] | null, idUsuario: number) => database.transaction().setIsolationLevel('repeatable read').execute(async (trx) => {
      const desde = DateTime.fromISO(query.desde, { zone: 'America/Managua' }).startOf('day').toJSDate();
      const hasta = DateTime.fromISO(query.hasta, { zone: 'America/Managua' }).plus({ days: 1 }).startOf('day').toJSDate();
      if (query.clase === 'BITACORA') {
        let rows = trx.selectFrom('bitacora as b').innerJoin('tickets as t', 't.idTicket', 'b.idTicket')
          .leftJoin('usuarios as u', 'u.idUsuario', 'b.idUsuario').leftJoin('tareasProgramadas as job', 'job.idTarea', 'b.idTarea')
          .where('b.fechaHora', '>=', desde).where('b.fechaHora', '<', hasta);
        rows = rows.where((eb) => eb.not(eb.and([eb('b.accion', '=', 'COMENTARIO_INTERNO'), eb('t.idSolicitante', '=', idUsuario)])));
        if (sedes !== null) rows = rows.where('t.idSede', 'in', sedes.length ? sedes : [-1]);
        if (query.numero) rows = rows.where('t.numero', '=', query.numero);
        if (query.accion) rows = rows.where('b.accion', '=', query.accion);
        const count = await rows.select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow();
        const data = await rows.select(['b.idBitacora as idRegistro', 'b.fechaHora', 'b.accion', 'b.automatica', 'b.direccionIp', 'b.hashPrevio', 'b.hashRegistro',
          't.numero', 'u.nombreCompleto as actor', 'u.username as cuenta', 'job.codigo as tarea', sql<string>`'tickets'`.as('entidad'), sql<null>`null`.as('resultado')])
          .orderBy('b.fechaHora', 'desc').orderBy('b.idBitacora', 'desc').limit(query.pageSize).offset((query.page - 1) * query.pageSize).execute();
        return { data, total: Number(count.total) };
      }
      let rows = trx.selectFrom('auditoriaSistema as b').leftJoin('usuarios as u', 'u.idUsuario', 'b.idUsuario')
        .leftJoin('tareasProgramadas as job', 'job.idTarea', 'b.idTarea').where('b.fechaHora', '>=', desde).where('b.fechaHora', '<', hasta);
      if (query.accion) rows = rows.where('b.accion', '=', query.accion);
      if (query.entidad) rows = rows.where('b.entidad', '=', query.entidad);
      const count = await rows.select((eb) => eb.fn.countAll().as('total')).executeTakeFirstOrThrow();
      const data = await rows.select(['b.idAuditoria as idRegistro', 'b.fechaHora', 'b.accion', 'b.direccionIp', 'b.hashPrevio', 'b.hashRegistro', 'b.entidad', 'b.resultado',
        'u.nombreCompleto as actor', 'u.username as cuenta', 'job.codigo as tarea', sql<null>`null`.as('numero'), sql<boolean>`b.id_usuario is null`.as('automatica')])
        .orderBy('b.fechaHora', 'desc').orderBy('b.idAuditoria', 'desc').limit(query.pageSize).offset((query.page - 1) * query.pageSize).execute();
      return { data, total: Number(count.total) };
    }),
    integrity: () => database.transaction().setIsolationLevel('repeatable read').execute(async (trx) => {
      const result = await sql<{ bitacora: boolean; sistema: boolean; registrosBitacora: string; registrosSistema: string }>`select
        verificar_cadena_bitacora() as bitacora, verificar_cadena_auditoria() as sistema,
        (select count(*) from bitacora) as registros_bitacora, (select count(*) from auditoria_sistema) as registros_sistema`.execute(trx);
      const row = result.rows[0]; if (!row) throw new Error('No se obtuvo resultado de verificación.');
      return { bitacora: { valida: row.bitacora, registros: Number(row.registrosBitacora) }, sistema: { valida: row.sistema, registros: Number(row.registrosSistema) } };
    }),
    recordReport: async (context: SessionContext, filters: ReportsQuery, format?: ReportsFormat, ip?: string) => {
      await database.insertInto('auditoriaSistema').values({ idUsuario: context.usuario.idUsuario, idSesion: context.idSesion, entidad: 'reportes',
        accion: format ? 'REPORTE_EXPORTADO' : 'REPORTE_CONSULTADO', resultado: 'EXITO', fechaHora: new Date(), direccionIp: ip ?? context.direccionIp ?? null,
        detalle: { desde: filters.desde, hasta: filters.hasta, idSede: filters.idSede ?? null, idCategoria: filters.idCategoria ?? null, formato: format ?? null,
          alcanceSedes: context.grants.filter((grant) => grant.codigo === (format ? 'reporte.exportar' : 'reporte.ver')).map((grant) => grant.idSedeAlcance) },
        hashPrevio: '', hashRegistro: '' }).execute();
    },
  };
}
