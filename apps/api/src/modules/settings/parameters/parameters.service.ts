import { parameterKeySchema, parameterListSchema, parameterDefinitions, parameterUpdateSchema, parameterValueSchema } from '@helpdesk/contracts';
import type { ParameterKey, ParameterUpdate } from '@helpdesk/contracts';
import type { SessionContext } from '../../auth/index.js';
import { AppError } from '../../../common/errors/app-error.js';
import { requireParameterAdmin } from './parameters.policies.js';
import { mapParameter } from './parameters.mapper.js';
import type { ParametersRepository } from './parameters.repository.js';

export function buildParametersService(repository: ParametersRepository) {
  return {
    list: async (context: SessionContext | null) => {
      requireParameterAdmin(context);
      return parameterListSchema.parse({ data: await Promise.all(parameterKeySchema.options.map(async (clave) => mapParameter(clave, await repository.find(clave)))) });
    },
    edit: async (context: SessionContext | null, key: ParameterKey, input: ParameterUpdate, now = new Date()) => {
      requireParameterAdmin(context);
      const clave = parameterKeySchema.parse(key); const data = parameterUpdateSchema.parse(input);
      if (!parameterDefinitions[clave].editable) throw new AppError('NO_AUTORIZADO', 403, 'El cierre automático conserva las 48 horas exigidas por RN-06.');
      const validated = parameterValueSchema(clave).safeParse(data.valor);
      if (!validated.success) throw new AppError('ENTRADA_INVALIDA', 400, 'El valor está fuera de los límites permitidos para este parámetro.');
      const value = validated.data;
      return repository.atomic(async (repo) => {
        const previous = mapParameter(clave, await repo.find(clave));
        if (previous.valor !== data.valorAnterior) throw new AppError('ENTRADA_INVALIDA', 409, 'Otra persona editó el parámetro. Recargá antes de guardar.');
        await repo.save(clave, value, context, now);
        await repo.audit(clave, previous.valor, value, context, now);
        return mapParameter(clave, await repo.find(clave));
      });
    },
  };
}
export type ParametersService = ReturnType<typeof buildParametersService>;
