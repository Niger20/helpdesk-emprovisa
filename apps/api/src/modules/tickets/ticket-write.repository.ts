import { sql } from 'kysely';
import type { Insertable, Transaction } from 'kysely';
import type { Database } from '../../infra/db/client.js';
import type { DB } from '../../infra/db/generated-types.js';
import type { SessionContext } from '../auth/index.js';

export function createTicketWriteRepository(executor: Database | Transaction<DB>) {
  return {
    requester: (id: number) => executor.selectFrom('usuarios').select(['idUsuario', 'nombreCompleto', 'idSede']).where('idUsuario', '=', id).where('estado', '=', 'ACTIVO').executeTakeFirst(),
    category: (id: number) => executor.selectFrom('categorias').selectAll().where('idCategoria', '=', id).where('activa', '=', true).forShare().executeTakeFirst(),
    resolverGroup: async (idGrupo: number | null, idSede: number) => {
      if (idGrupo === null) return null;
      const group = await executor.selectFrom('gruposResolutores').selectAll().where('idGrupo', '=', idGrupo).where('activo', '=', true).executeTakeFirst();
      if (!group) return undefined;
      if (group.idSede === null || group.idSede === idSede) return group.idGrupo;
      return (await executor.selectFrom('gruposResolutores').select('idGrupo').where('idSede', '=', idSede).where('nivel', '=', group.nivel)
        .where('activo', '=', true).orderBy('idGrupo').executeTakeFirst())?.idGrupo;
    },
    asset: (id: number) => executor.selectFrom('activosTi').selectAll().where('idActivo', '=', id).executeTakeFirst(),
    priority: (impacto: string, urgencia: string) => executor.selectFrom('matrizPrioridad as m')
      .innerJoin('prioridadesSla as p', 'p.idPrioridad', 'm.idPrioridad').selectAll('p')
      .where('m.impacto', '=', impacto).where('m.urgencia', '=', urgencia).where('p.activa', '=', true).executeTakeFirst(),
    calendar: async (siteId: number) => {
      const calendar = await executor.selectFrom('sedes').innerJoin('calendariosLaborales', 'calendariosLaborales.idCalendario', 'sedes.idCalendario')
        .select(['calendariosLaborales.idCalendario', 'zonaHoraria']).where('idSede', '=', siteId).where('sedes.activa', '=', true).executeTakeFirstOrThrow();
      const horarios = await executor.selectFrom('horariosLaborales').select(['diaSemana', 'horaInicio', 'horaFin']).where('idCalendario', '=', calendar.idCalendario).execute();
      const feriados = await executor.selectFrom('feriados').select('fecha').where('idCalendario', '=', calendar.idCalendario).execute();
      return { zonaHoraria: calendar.zonaHoraria, horarios, feriados: feriados.map((day) => day.fecha) };
    },
    newId: async () => Number((await sql<{ id: string }>`select nextval(pg_get_serial_sequence('tickets', 'id_ticket')) as id`.execute(executor)).rows[0]?.id),
    newState: () => executor.selectFrom('estadosTicket').select('idEstado').where('codigo', '=', 'NUEVO').executeTakeFirstOrThrow(),
    insert: (ticket: Insertable<DB['tickets']>) => executor.insertInto('tickets').values(ticket).execute(),
    logCreation: (idTicket: number, context: SessionContext, now: Date) => executor.insertInto('bitacora').values({
      idTicket, idUsuario: context.usuario.idUsuario, idSesion: context.idSesion, accion: 'CREACION',
      campoAfectado: 'id_estado', valorNuevo: { estado: 'NUEVO' }, fechaHora: now, automatica: false, direccionIp: context.direccionIp ?? null,
      hashPrevio: '', hashRegistro: '',
    }).execute(),
    alert: (idTicket: number, tipo: string, when: Date) => executor.insertInto('slaAlertas').values({
      idTicket, cicloSla: 1, tipo, programadaPara: when, estado: 'PENDIENTE',
    }).execute(),
    options: async (context: SessionContext) => {
      const thirdParty = context.grants.filter((grant) => grant.codigo === 'ticket.registrar_tercero');
      const global = thirdParty.some((grant) => grant.idSedeAlcance === null);
      const sites = thirdParty.flatMap((grant) => grant.idSedeAlcance === null ? [] : [grant.idSedeAlcance]);
      const solicitantes = await executor.selectFrom('usuarios').select(['idUsuario', 'nombreCompleto', 'idSede']).where('estado', '=', 'ACTIVO')
        .where((eb) => global ? eb.val(true) : eb.or([eb('idUsuario', '=', context.usuario.idUsuario), ...(sites.length ? [eb('idSede', 'in', sites)] : [])])).execute();
      const activos = await executor.selectFrom('activosTi').select(['idActivo', 'codigoPatrimonial', 'idSede'])
        .where('idSede', 'in', [...new Set(solicitantes.map((user) => user.idSede))]).execute();
      const categorias = await executor.selectFrom('categorias').select(['idCategoria', 'nombre', 'tipoAplicable', 'requiereActivo']).where('activa', '=', true).orderBy('orden').execute();
      const matriz = await executor.selectFrom('matrizPrioridad').innerJoin('prioridadesSla', 'prioridadesSla.idPrioridad', 'matrizPrioridad.idPrioridad')
        .select(['impacto', 'urgencia', 'prioridadesSla.codigo as prioridad']).where('prioridadesSla.activa', '=', true).execute();
      return { solicitantes, activos, categorias, matriz };
    },
  };
}
