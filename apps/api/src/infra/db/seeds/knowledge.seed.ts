import { createHash } from 'node:crypto';
import type { SeedTransaction } from './context.js';

export async function seedKnowledge(trx: SeedTransaction, now: Date) {
  const content = 'Verificá que la impresora esté encendida y conectada a la red. Revisá la cola de impresión. Si la falla continúa, registrá un ticket con el código patrimonial.';
  await trx.insertInto('articulosKb').values({
    idArticulo: 1, titulo: 'Cómo revisar una impresora sin conexión', resumen: 'Revisiones básicas antes de reportar una falla.',
    contenido: content, idCategoria: 1, idAutor: 6, idRevisor: 1, estado: 'PUBLICADO',
    visibilidad: 'PUBLICO', versionActual: 1, publicadoEn: now, totalVistas: 12,
  }).execute();
  await trx.insertInto('articulosKbVersiones').values({
    idArticulo: 1, numeroVersion: 1, titulo: 'Cómo revisar una impresora sin conexión', contenido: content,
    editadoPor: 6, fechaEdicion: now, motivoCambio: 'Versión inicial de demostración',
  }).execute();
  await trx.insertInto('ticketArticulos').values({ idTicket: 6, idArticulo: 1, uso: 'SOLUCION', vinculadoPor: 9, fecha: now }).execute();
  await trx.insertInto('kbVotos').values({ idArticulo: 1, idUsuario: 4, util: true, comentario: 'La guía ayudó a revisar la conexión (demo).', fecha: now }).execute();
  await trx.insertInto('encuestasCsat').values({
    idTicket: 7, tokenHash: createHash('sha256').update('token-demostracion-no-publicado').digest('hex'),
    calificacion: 5, comentario: 'La cuenta quedó habilitada y la atención fue clara (demo).',
    enviadaEn: now, respondidaEn: now, expiraEn: new Date(now.getTime() + 7 * 86_400_000),
  }).execute();
}
