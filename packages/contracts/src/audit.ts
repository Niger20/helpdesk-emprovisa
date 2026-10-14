import { z } from 'zod';
import { numeroTicketSchema } from './tickets.js';

export const auditQuerySchema = z.object({ clase: z.enum(['BITACORA', 'SISTEMA']).default('BITACORA'),
  desde: z.iso.date(), hasta: z.iso.date(), numero: numeroTicketSchema.optional(),
  accion: z.string().trim().min(1).max(50).optional(), entidad: z.string().trim().min(1).max(50).optional(),
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(20),
}).refine((query) => query.desde <= query.hasta, 'La fecha inicial debe ser anterior o igual a la final.')
  .refine((query) => query.clase === 'BITACORA' ? !query.entidad : !query.numero, 'El filtro no corresponde al tipo de registro.');
export type AuditQuery = z.infer<typeof auditQuerySchema>;
export const auditEventSchema = z.object({ idRegistro: z.string(), fechaHora: z.iso.datetime(), accion: z.string(),
  entidad: z.string(), numero: numeroTicketSchema.nullable(), actor: z.string(), automatica: z.boolean(),
  resultado: z.string().nullable(), direccionIp: z.string().nullable(), tarea: z.string().nullable(),
  hashPrevio: z.string().regex(/^[a-f0-9]{64}$/), hashRegistro: z.string().regex(/^[a-f0-9]{64}$/) });
export const auditListSchema = z.object({ data: z.array(auditEventSchema), meta: z.object({ page: z.number().int(), pageSize: z.number().int(), total: z.number().int() }) });
export const auditIntegritySchema = z.object({ verificadaEn: z.iso.datetime(), bitacora: z.object({ valida: z.boolean(), registros: z.number().int().nonnegative() }),
  sistema: z.object({ valida: z.boolean(), registros: z.number().int().nonnegative() }) });
