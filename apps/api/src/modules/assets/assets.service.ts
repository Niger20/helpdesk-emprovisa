import { assetCreateSchema, assetQuerySchema, assetDetailSchema } from '@helpdesk/contracts';
import type { AssetCreate, AssetQuery } from '@helpdesk/contracts';
import { DateTime } from 'luxon';
import type { SessionContext } from '../auth/index.js';
import { AppError } from '../../common/errors/app-error.js';
import { assertAssetSede, assetScope, assetIncidentScope } from './assets.policies.js';
import { mapAsset } from './assets.mapper.js';
import type { AssetsRepository } from './assets.repository.js';

export function buildAssetsService(repository: AssetsRepository) {
  const detail = async (context: SessionContext | null, codigo: string) => {
    assetScope(context, 'activo.ver');
    const row = await repository.find(codigo);
    if (!row) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró el activo.');
    assertAssetSede(context, 'activo.ver', row.idSede);
    if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.');
    const date = DateTime.now().setZone('America/Managua').toISODate() ?? '';
    const incidentes = await repository.incidents(row.idActivo, assetIncidentScope(context), date);
    return assetDetailSchema.parse({ ...mapAsset(row), custodiaHistorial: await repository.history(row.idActivo),
      incidentes: incidentes.map((incident) => ({ ...incident, fechaCreacion: incident.fechaCreacion.toISOString() })) });
  };
  return {
    list: async (context: SessionContext | null, query: AssetQuery) => {
      const scope = assetScope(context, 'activo.ver');
      const input = assetQuerySchema.parse(query);
      if (input.idSede) assertAssetSede(context, 'activo.ver', input.idSede);
      const { rows, total } = await repository.list(input, scope);
      return { data: rows.map(mapAsset), meta: { page: input.page, pageSize: input.pageSize, total } };
    },
    detail,
    catalogs: (context: SessionContext | null) => repository.catalogs(assetScope(context, 'activo.ver')),
    create: async (context: SessionContext | null, input: AssetCreate, now = new Date()) => {
      const data = assetCreateSchema.parse(input);
      assertAssetSede(context, 'activo.crear', data.idSede);
      assertAssetSede(context, 'activo.ver', data.idSede);
      if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.');
      try {
        await repository.atomic(async (trx) => {
          const references = await trx.references(data);
          if (!references.tipo || !references.sede || (data.idCustodio && !references.custodio)) {
            throw new AppError('ENTRADA_INVALIDA', 400, 'Seleccioná un tipo, sede y custodio vigentes.');
          }
          const { idActivo } = await trx.insert(data);
          await trx.custody(idActivo, data, context, DateTime.fromJSDate(now).setZone('America/Managua').toISODate() ?? '');
          await trx.audit(idActivo, data, context, now);
        });
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
          throw new AppError('ENTRADA_INVALIDA', 409, 'El código patrimonial ya está registrado.');
        }
        throw error;
      }
      return detail(context, data.codigoPatrimonial);
    },
  };
}
export type AssetsService = ReturnType<typeof buildAssetsService>;
