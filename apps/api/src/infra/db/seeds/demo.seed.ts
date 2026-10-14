import { sql } from 'kysely';
import type { Database } from '../client.js';
import { seedCatalog } from './catalog.seed.js';
import { seedPermissions } from './permissions.seed.js';
import { seedIdentity } from './identity.seed.js';
import { seedAssets } from './assets.seed.js';
import { seedTickets } from './tickets.seed.js';
import { seedKnowledge } from './knowledge.seed.js';
import { seedJobs } from './jobs.seed.js';
import { syncSequences } from './sequence.repository.js';

export async function seedDemo(database: Database, password: string, now = new Date()) {
  return database.transaction().execute(async (trx) => {
    await sql`select pg_advisory_xact_lock(2026002, 3)`.execute(trx);
    const marker = await trx.selectFrom('parametros').select('valor').where('clave', '=', 'demo.seed.version').executeTakeFirst();
    if (marker) {
      if (marker.valor !== '1') throw new Error('La base tiene otra versión de seed.');
      return 'YA_EXISTE';
    }
    for (const table of ['usuarios', 'tickets', 'sedes', 'categorias', 'roles'] as const) {
      if (await trx.selectFrom(table).selectAll().limit(1).executeTakeFirst()) {
        throw new Error('La seed requiere una base vacía; no reemplaza datos existentes.');
      }
    }
    await seedCatalog(trx, now);
    await seedPermissions(trx);
    await seedIdentity(trx, password, now);
    await seedAssets(trx, now);
    await seedTickets(trx, now);
    await seedKnowledge(trx, now);
    await seedJobs(trx, now);
    await trx.insertInto('auditoriaSistema').values({
      idUsuario: 1, accion: 'SEED_DEMO', entidad: 'sistema', detalle: { ficticia: true, version: 1 },
      resultado: 'EXITO', direccionIp: '127.0.0.1', fechaHora: now, hashPrevio: '', hashRegistro: '',
    }).execute();
    await trx.insertInto('parametros').values({ clave: 'demo.seed.version', valor: '1', tipoDato: 'ENTERO', modificadoEn: now }).execute();
    await syncSequences(trx);
    return 'CREADA';
  });
}
