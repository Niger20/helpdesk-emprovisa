import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createDatabase } from '../src/infra/db/client.js';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import type { SessionContext } from '../src/modules/auth/index.js';
import { createAuthService } from '../src/modules/auth/index.js';
import { buildTicketsService } from '../src/modules/tickets/index.js';
import { buildJobsService } from '../src/modules/jobs/index.js';
import { buildApp } from '../src/app.js';
import { authenticated } from './auth-http.js';
import { buildMailIngestService } from '../src/modules/mail-ingest/index.js';

export function automaticAssignmentChecks(database: Database, env: Env) {
  describe('Asignación automática por categoría, especialidad, sede y carga', () => {
    const now = new Date('2026-10-18T16:00:00Z');
    let app: FastifyInstance; let owner: SessionContext; let idCategoria: number; let first: number; let second: number;
    let sequence = 0;
    const service = buildTicketsService(database);
    const jobs = buildJobsService(database, async () => {}, async () => {});
    beforeEach(async () => {
      await database.updateTable('usuarios').set({ estado: 'ACTIVO', intentosFallidos: 0, bloqueadoHasta: null }).execute();
      await database.deleteFrom('intentosLogin').execute();
      await database.updateTable('tareasProgramadas').set({ activa: true }).where('codigo', '=', 'ticket-auto-assignment').execute();
      app = await buildApp(env, async () => true, await createAuthService(database, env.CSRF_SECRET), service);
      const login = await authenticated(app, 'ana.managua');
      const context = await (await createAuthService(database, env.CSRF_SECRET)).load(login.rawToken, new Date());
      if (!context) throw new Error('Falta sesión de prueba.'); owner = context;
      const category = await database.insertInto('categorias').values({ nombre: `Categoría automática ${++sequence}`, tipoAplicable: 'INCIDENTE', requiereActivo: false,
        idGrupoDefault: 1, activa: true, orden: 10 }).returning('idCategoria').executeTakeFirstOrThrow(); idCategoria = category.idCategoria;
      const original = await database.selectFrom('usuarios').selectAll().where('idUsuario', '=', 5).executeTakeFirstOrThrow();
      const users = await database.insertInto('usuarios').values(['a', 'b'].map((key) => ({ ...original, idUsuario: undefined,
        username: `auto-${sequence}-${key}`, correo: `auto-${sequence}-${key}@example.invalid`, nombreCompleto: `Analista automático ${key} (demo)` }))).returning('idUsuario').execute();
      first = users[0]?.idUsuario ?? 0; second = users[1]?.idUsuario ?? 0;
      await database.insertInto('grupoMiembros').values([first, second].map((idUsuario) => ({ idUsuario, idGrupo: 1, esCoordinador: false, desde: '2026-10-12' }))).execute();
      await database.insertInto('usuarioRol').values([first, second].map((idUsuario) => ({ idUsuario, idRol: 2, idSedeAlcance: 1, vigenteDesde: '2026-10-12', asignadoPor: 1 }))).execute();
      await database.insertInto('usuarioEspecialidad').values([{ idUsuario: first, idCategoria, nivelDominio: 1 }, { idUsuario: second, idCategoria, nivelDominio: 2 }]).execute();
    });
    afterEach(async () => { await app.close(); });
    const input = () => ({ titulo: `Asignación automática ${sequence}`, descripcion: 'Caso ficticio', tipo: 'INCIDENTE' as const,
      idCategoria, idActivo: null, impacto: 'ALTO' as const, urgencia: 'ALTA' as const, idSolicitante: 2, canalIngreso: 'PORTAL' as const });
    const create = () => service.create(owner, input(), now);
    const row = (numero: string) => database.selectFrom('tickets').selectAll().where('numero', '=', numero).executeTakeFirstOrThrow();
    it('asigna desde el portal, preserva SLA y primera respuesta, y permite iniciar atención', async () => {
      const { numero } = await create(); const ticket = await row(numero);
      expect(ticket).toMatchObject({ idAsignado: second, version: 2, fechaPrimeraRespuesta: null });
      expect(ticket.fechaLimiteRespuesta.getTime() - now.getTime()).toBe(15 * 60_000);
      expect(ticket.fechaLimiteSolucion.getTime() - now.getTime()).toBe(120 * 60_000);
      const history = await database.selectFrom('bitacora').selectAll().where('idTicket', '=', ticket.idTicket).where('accion', '=', 'ASIGNACION').execute();
      expect(history).toHaveLength(1); expect(history[0]).toMatchObject({ automatica: true, idUsuario: null, idSesion: null }); expect(history[0]?.idTarea).not.toBeNull();
      const tech = await authenticated(app, `auto-${sequence}-b`);
      const context = await (await createAuthService(database, env.CSRF_SECRET)).load(tech.rawToken, new Date());
      await service.attend(context, numero, { version: 2 }, new Date(now.getTime() + 60_000));
      expect((await row(numero)).fechaPrimeraRespuesta).toEqual(new Date(now.getTime() + 60_000));
      expect((await service.detail(owner, numero, now)).ticket.asignado).toContain('Analista automático b');
    });
    it('deja cola sin especialistas y reintenta al habilitar una especialidad; no reasigna al repetir', async () => {
      await database.updateTable('usuarioEspecialidad').set({ nivelDominio: 0 }).where('idCategoria', '=', idCategoria).execute();
      const { numero } = await create(); expect((await row(numero)).idAsignado).toBeNull();
      await database.updateTable('usuarioEspecialidad').set({ nivelDominio: 1 }).where('idCategoria', '=', idCategoria).where('idUsuario', '=', first).execute();
      await jobs.run('ticket-auto-assignment', now); await jobs.run('ticket-auto-assignment', now);
      const ticket = await row(numero); expect(ticket).toMatchObject({ idAsignado: first, version: 2 });
      expect(await database.selectFrom('ticketAsignaciones').selectAll().where('idTicket', '=', ticket.idTicket).execute()).toHaveLength(1);
    });
    it('excluye usuarios inactivos y membresías vencidas', async () => {
      await database.updateTable('usuarios').set({ estado: 'INACTIVO' }).where('idUsuario', '=', first).execute();
      await database.updateTable('grupoMiembros').set({ hasta: '2026-10-17' }).where('idUsuario', '=', second).execute();
      const { numero } = await create(); expect((await row(numero)).idAsignado).toBeNull();
    });
    it('excluye permisos vencidos o de otra sede aunque tengan grupo y especialidad', async () => {
      await database.updateTable('usuarioRol').set({ idSedeAlcance: 2 }).where('idUsuario', '=', first).execute();
      await database.updateTable('usuarioRol').set({ vigenteHasta: '2026-10-17' }).where('idUsuario', '=', second).execute();
      const { numero } = await create(); expect((await row(numero)).idAsignado).toBeNull();
    });
    it('nunca asigna automáticamente al propio solicitante técnico', async () => {
      await database.updateTable('usuarios').set({ estado: 'INACTIVO' }).where('idUsuario', '=', first).execute();
      const login = await authenticated(app, `auto-${sequence}-b`);
      const context = await (await createAuthService(database, env.CSRF_SECRET)).load(login.rawToken, new Date());
      const created = await service.create(context, { ...input(), idSolicitante: second }, now);
      expect((await row(created.numero)).idAsignado).toBeNull();
    });
    it('equilibra cuatro altas concurrentes con conexiones reales independientes', async () => {
      const concurrentDatabase = createDatabase(env.DATABASE_URL, 3);
      try {
        const concurrentService = buildTicketsService(concurrentDatabase);
        const created = await Promise.all([1, 2, 3, 4].map(() => concurrentService.create(owner, input(), now)));
        const rows = await Promise.all(created.map((ticket) => row(ticket.numero)));
        expect(rows.filter((ticket) => ticket.idAsignado === first)).toHaveLength(2);
        expect(rows.filter((ticket) => ticket.idAsignado === second)).toHaveLength(2);
        expect(rows.every((ticket) => ticket.version === 2)).toBe(true);
      } finally { await concurrentDatabase.destroy(); }
    });
    it('aplica la misma selección a un alta recibida por correo simulado', async () => {
      const chief = await authenticated(app);
      const context = await (await createAuthService(database, env.CSRF_SECRET)).load(chief.rawToken, new Date());
      const messageId = `automatic-${sequence}@example.invalid`;
      await buildMailIngestService(database).enqueue(context, { messageId, inReplyTo: null, usernameRemitente: 'ana.managua', contenido: 'Solicitud ficticia por correo',
        solicitud: { titulo: 'Asignación desde correo', descripcion: 'Prueba ficticia', tipo: 'INCIDENTE', idCategoria, idActivo: null, impacto: 'ALTO', urgencia: 'ALTA' } }, now);
      const ingest = buildJobsService(database, async () => {}, (trx, when) => buildMailIngestService(trx).ingest(when));
      await ingest.run('mail-ingest', now);
      const message = await database.selectFrom('correosEntrantes').selectAll().where('messageId', '=', messageId).executeTakeFirstOrThrow();
      expect(message.estado).toBe('PROCESADO');
      expect(await database.selectFrom('tickets').selectAll().where('idTicket', '=', message.idTicket ?? 0).executeTakeFirstOrThrow())
        .toMatchObject({ idAsignado: second, version: 2, canalIngreso: 'CORREO', fechaPrimeraRespuesta: null });
    });
    it('revierte alta, alertas y evidencia si falta la transición automática', async () => {
      const initial = await database.selectFrom('estadosTicket').select('idEstado').where('codigo', '=', 'NUEVO').executeTakeFirstOrThrow();
      const assigned = await database.selectFrom('estadosTicket').select('idEstado').where('codigo', '=', 'ASIGNADO').executeTakeFirstOrThrow();
      const transition = await database.selectFrom('transicionesEstado').selectAll().where('idEstadoOrigen', '=', initial.idEstado).where('idEstadoDestino', '=', assigned.idEstado).where('automatica', '=', true).executeTakeFirstOrThrow();
      await database.deleteFrom('transicionesEstado').where('idTransicion', '=', transition.idTransicion).execute();
      try {
        await expect(create()).rejects.toThrow('Falta la transición');
        expect(await database.selectFrom('tickets').select('idTicket').where('idCategoria', '=', idCategoria).execute()).toHaveLength(0);
      } finally { await database.insertInto('transicionesEstado').values(transition).execute(); }
    });
    it('permite desactivar asignación desde tareas sin perder el ticket', async () => {
      await database.updateTable('tareasProgramadas').set({ activa: false }).where('codigo', '=', 'ticket-auto-assignment').execute();
      const { numero } = await create(); expect((await row(numero)).idAsignado).toBeNull();
    });
  });
}
