import { parameterDefinitions, parameterSchema, parameterValueSchema } from '@helpdesk/contracts';
import type { ParameterKey } from '@helpdesk/contracts';
import { AppError } from '../../../common/errors/app-error.js';
import type { ParametersRepository } from './parameters.repository.js';

export function mapParameter(clave: ParameterKey, row: Awaited<ReturnType<ParametersRepository['find']>>) {
  const definition = parameterDefinitions[clave];
  if ((!row && !definition.admiteAusente) || (row && (row.tipoDato !== 'ENTERO' || !/^\d+$/.test(row.valor)))) {
    throw new AppError('ERROR_INTERNO', 500, 'Un parámetro operativo no está configurado correctamente.');
  }
  const value = parameterValueSchema(clave).safeParse(row ? Number(row.valor) : definition.predeterminado);
  if (!value.success) throw new AppError('ERROR_INTERNO', 500, 'Un parámetro operativo está fuera de sus límites.');
  return parameterSchema.parse({ clave, valor: value.data, tipoDato: 'ENTERO', nombre: definition.nombre, descripcion: definition.descripcion,
    minimo: definition.minimo, maximo: definition.maximo, unidad: definition.unidad, editable: definition.editable,
    origen: row ? 'CONFIGURADO' : 'PREDETERMINADO', modificadoEn: row ? row.modificadoEn.toISOString() : null });
}
