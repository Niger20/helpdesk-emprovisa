import { z } from 'zod';

export const errorCodeSchema = z.enum([
  'NO_AUTENTICADO', 'NO_AUTORIZADO', 'ENTRADA_INVALIDA',
  'RUTA_NO_ENCONTRADA', 'LIMITE_EXCEDIDO', 'ERROR_INTERNO',
  'CREDENCIALES_INVALIDAS', 'CSRF_INVALIDO',
  'RECURSO_NO_ENCONTRADO', 'ACTIVO_REQUERIDO', 'CATALOGO_INVALIDO',
  'CONFLICTO_VERSION', 'TRANSICION_INVALIDA',
  'REAPERTURA_FUERA_PLAZO',
]);

export const problemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  code: errorCodeSchema,
  detail: z.string(),
  instance: z.string(),
});

export type ErrorCode = z.infer<typeof errorCodeSchema>;
export type Problem = z.infer<typeof problemSchema>;
