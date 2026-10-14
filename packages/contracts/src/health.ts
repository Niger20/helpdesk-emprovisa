import { z } from 'zod';

export const healthResponseSchema = z.object({
  estado: z.enum(['DISPONIBLE', 'NO_DISPONIBLE']),
  fechaHora: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
