import { PgBoss } from 'pg-boss';
import { jobCodeSchema } from '@helpdesk/contracts';
import type { JobsService } from '../../modules/jobs/index.js';

export async function startQueue(connectionString: string, service: JobsService, onError: (error: Error) => void) {
  const boss = new PgBoss({ connectionString, schema: 'helpdesk_queue', max: 3, migrate: false,
    supervise: true, reindex: false, monitorVacuum: false });
  boss.on('error', onError);
  try {
    await boss.start();
    for (const task of await service.schedules()) {
      const codigo = jobCodeSchema.parse(task.codigo);
      await boss.work(codigo, { batchSize: 1 }, async () => { await service.run(codigo); });
      if (task.activa) await boss.schedule(codigo, task.expresionCron, {}, { tz: 'America/Managua' });
      else await boss.unschedule(codigo);
    }
    return boss;
  } catch (error) { await boss.stop(); throw error; }
}
