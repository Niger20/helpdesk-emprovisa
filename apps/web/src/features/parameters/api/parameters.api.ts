import { parameterListSchema, parameterSchema } from '@helpdesk/contracts';
import type { ParameterKey, ParameterUpdate } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

export const parametersKeys = { all: ['admin-parametros'] as const };
export const fetchParameters = () => http('/api/v1/admin/parametros', parameterListSchema);
export const saveParameter = (clave: ParameterKey, data: ParameterUpdate, csrf: string) => http(`/api/v1/admin/parametros/${encodeURIComponent(clave)}`, parameterSchema,
  { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf }, body: JSON.stringify(data) });
