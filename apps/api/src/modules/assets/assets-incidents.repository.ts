import type { Transaction } from 'kysely';
import type { Database } from '../../infra/db/client.js';
import type { DB } from '../../infra/db/generated-types.js';
import type { AssetIncidentScope } from './assets.policies.js';

export function createAssetIncidentsRepository(executor: Database | Transaction<DB>) {
  return {
    incidents: (idActivo: number, scope: AssetIncidentScope, date: string) => executor.selectFrom('tickets as t')
      .innerJoin('estadosTicket as e', 'e.idEstado', 't.idEstado')
      .select(['t.numero', 't.titulo', 't.fechaCreacion', 'e.codigo as estado'])
      .where('t.idActivo', '=', idActivo).where('t.tipo', '=', 'INCIDENTE')
      .where((eb) => scope.all ? eb.val(true) : eb.or([
        ...(scope.own ? [eb('t.idSolicitante', '=', scope.userId)] : []),
        ...(scope.sites.length ? [eb('t.idSede', 'in', scope.sites)] : []),
        ...(scope.group ? [eb('t.idAsignado', '=', scope.userId), eb('t.idGrupo', 'in', eb.selectFrom('grupoMiembros').select('idGrupo')
          .where('idUsuario', '=', scope.userId).where('desde', '<=', date)
          .where((member) => member.or([member('hasta', 'is', null), member('hasta', '>=', date)])))] : []),
      ])).orderBy('t.fechaCreacion', 'desc').orderBy('t.numero', 'desc').limit(5).execute(),
  };
}
