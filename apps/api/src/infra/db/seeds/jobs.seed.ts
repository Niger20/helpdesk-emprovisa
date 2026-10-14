import type { SeedTransaction } from './context.js';

export async function seedJobs(trx: SeedTransaction, now: Date) {
  const jobs = [
    ['sla-threshold', '* * * * *'], ['sla-breach-escalation', '* * * * *'],
    ['auto-close-resolved', '*/15 * * * *'], ['mail-ingest', '*/2 * * * *'],
    ['notification-dispatch', '* * * * *'], ['audit-chain-verify', '0 3 * * *'],
    ['ticket-auto-assignment', '* * * * *'],
  ];
  await trx.insertInto('tareasProgramadas').values(jobs.map(([codigo, expresionCron], index) => ({
    idTarea: index >= 5 ? index + 2 : index + 1, codigo: codigo ?? '', expresionCron: expresionCron ?? '', activa: true,
  }))).execute();
  await trx.insertInto('plantillasNotificacion').values({
    idPlantilla: 1, codigoEvento: 'TICKET_CREADO', asunto: 'Ticket registrado',
    cuerpo: 'Tu requerimiento fue registrado en la mesa de ayuda.', activa: true,
  }).execute();
  await trx.insertInto('notificaciones').values({
    idTicket: 1, idDestinatario: 3, idPlantilla: 1, correoDestino: 'carlos.rivas@example.invalid',
    asunto: 'TK-000001: Ticket registrado (demo)', estado: 'PENDIENTE', intentos: 0, encoladaEn: now,
  }).execute();
  await trx.insertInto('slaAlertas').values({
    idTicket: 3, cicloSla: 1, tipo: 'UMBRAL_50', programadaPara: new Date(now.getTime() - 10 * 60_000),
    disparadaEn: now, estado: 'ENVIADA',
  }).execute();
}
