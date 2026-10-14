import { z } from 'zod';

export const parameterKeySchema = z.enum(['sesion.inactividad_minutos', 'login.bloqueo_minutos', 'adjunto.maximo_bytes', 'ticket.cierre_inactividad_horas']);
export type ParameterKey = z.infer<typeof parameterKeySchema>;
export const parameterDefinitions = {
  'sesion.inactividad_minutos': { nombre: 'Inactividad de sesión', descripcion: 'La sesión vence sin actividad; nunca supera 30 minutos.', minimo: 1, maximo: 30, unidad: 'minutos', editable: true, predeterminado: 30, admiteAusente: true },
  'login.bloqueo_minutos': { nombre: 'Bloqueo de cuenta', descripcion: 'Duración del bloqueo tras cinco intentos fallidos consecutivos.', minimo: 15, maximo: 1440, unidad: 'minutos', editable: true, predeterminado: 15, admiteAusente: true },
  'adjunto.maximo_bytes': { nombre: 'Tamaño máximo de adjunto', descripcion: 'Límite por archivo JPG, PNG o PDF; máximo local de 10 MB.', minimo: 1, maximo: 10485760, unidad: 'bytes', editable: true, predeterminado: 10485760, admiteAusente: false },
  'ticket.cierre_inactividad_horas': { nombre: 'Cierre automático de tickets resueltos', descripcion: 'RN-06 exige 48 horas de inactividad. Este valor es de consulta.', minimo: 48, maximo: 48, unidad: 'horas', editable: false, predeterminado: 48, admiteAusente: false },
} as const satisfies Record<ParameterKey, object>;

export const parameterParamsSchema = z.object({ clave: parameterKeySchema }).strict();
export const parameterUpdateSchema = z.object({ valor: z.number().int().positive().max(2147483647), valorAnterior: z.number().int().positive().max(2147483647) }).strict();
export type ParameterUpdate = z.infer<typeof parameterUpdateSchema>;
export function parameterValueSchema(clave: ParameterKey) {
  const definition = parameterDefinitions[clave];
  return z.number().int().min(definition.minimo).max(definition.maximo);
}
export const parameterSchema = z.object({ clave: parameterKeySchema, valor: z.number().int(), tipoDato: z.literal('ENTERO'),
  nombre: z.string(), descripcion: z.string(), minimo: z.number().int(), maximo: z.number().int(), unidad: z.string(), editable: z.boolean(),
  origen: z.enum(['CONFIGURADO', 'PREDETERMINADO']), modificadoEn: z.iso.datetime().nullable() }).strict();
export type Parameter = z.infer<typeof parameterSchema>;
export const parameterListSchema = z.object({ data: z.array(parameterSchema) }).strict();
