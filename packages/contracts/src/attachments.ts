import { z } from 'zod';

export const adjuntoMimeSchema = z.enum(['image/jpeg', 'image/png', 'application/pdf']);
export const adjuntoSchema = z.object({
  idAdjunto: z.number().int().positive(), nombreOriginal: z.string().max(200),
  mimeType: adjuntoMimeSchema, tamanoBytes: z.number().int().positive(), fechaSubida: z.iso.datetime(),
});
export const adjuntosSchema = z.object({ data: z.array(adjuntoSchema), maximoBytes: z.number().int().positive(), puedeDescargar: z.boolean() });
export const adjuntoUploadSchema = z.object({ archivo: z.custom<File>((value) => value instanceof File && value.size > 0, 'Seleccioná un archivo.') });
export type Adjunto = z.infer<typeof adjuntoSchema>;
