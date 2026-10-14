import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { TicketLifecycleCommand, TicketCreate } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import type { Env } from '../src/config/env.js';
import { createAuthService } from '../src/modules/auth/index.js';
import type { SessionContext } from '../src/modules/auth/index.js';
import { buildTicketsService } from '../src/modules/tickets/index.js';
import { buildApp } from '../src/app.js';
import { authenticated } from './auth-http.js';

export function ticketLifecycleChecks(database: Database, env: Env) {
  describe('Ciclo completo: SLA, segregación, estados y trazabilidad', () => {
    let app: FastifyInstance;
    const service = buildTicketsService(database);
    const start = new Date('2026-10-13T14:00:00Z');
    const time = (minutes: number) => new Date(start.getTime() + minutes * 60000);
    beforeEach(async () => {
      await database.deleteFrom('intentosLogin').execute();
      await database.updateTable('usuarios').set({ estado: 'ACTIVO', intentosFallidos: 0, bloqueadoHasta: null }).execute();
      app = await buildApp(env, async () => true, await createAuthService(database, env.CSRF_SECRET), service);
    });
    afterEach(async () => { await app.close(); });
    const context = async (username: string) => {
      const login = await authenticated(app, username);
      const result = await (await createAuthService(database, env.CSRF_SECRET)).load(login.rawToken, new Date());
      if (!result) throw new Error('Falta contexto de prueba.');
      return result;
    };
    const payload = (idSolicitante = 2): TicketCreate => ({ titulo: 'Caso ficticio de ciclo completo', descripcion: 'Prueba de atención.', tipo: 'INCIDENTE',
      idCategoria: 4, impacto: 'ALTO', urgencia: 'ALTA', idActivo: null, idSolicitante, canalIngreso: 'PORTAL' });
    const row = (numero: string) => database.selectFrom('tickets').selectAll().where('numero', '=', numero).executeTakeFirstOrThrow();
    const create = async (owner: SessionContext, requester = 2) => (await service.create(owner, payload(requester), start)).numero;
    const take = async (numero: string, analyst: SessionContext) => {
      await service.assign(analyst, numero, { version: 1, idUsuario: analyst.usuario.idUsuario, motivo: 'Toma de prueba' }, time(1));
      await service.attend(analyst, numero, { version: 2 }, time(2));
    };
    const command = (actor: SessionContext, numero: string, data: TicketLifecycleCommand, minutes: number) => service.lifecycle(actor, numero, data, time(minutes));
    it('resuelve, confirma cierre, reabre con nuevo ciclo y conserva todas las resoluciones', async () => {
      const owner = await context('ana.managua'); const analyst = await context('analista.managua'); const numero = await create(owner);
      await take(numero, analyst);
      await command(analyst, numero, { accion: 'resolver', version: 3, causa: 'Configuración', solucion: 'Conexión restaurada.' }, 10);
      expect(await row(numero)).toMatchObject({ slaRespuestaCumplido: true, slaSolucionCumplido: true });
      await command(owner, numero, { accion: 'cerrar', version: 4, confirmacion: true }, 11);
      await command(owner, numero, { accion: 'reabrir', version: 5, motivo: 'La falla regresó' }, 12);
      const reopened = await row(numero);
      expect(reopened).toMatchObject({ numeroReaperturas: 1, minutosPausa: 0, fechaPrimeraRespuesta: null, fechaResolucion: null, fechaCierre: null });
      expect(reopened.fechaLimiteSolucion).toEqual(time(132));
      await service.attend(analyst, numero, { version: 6 }, time(13));
      await command(analyst, numero, { accion: 'resolver', version: 7, causa: null, solucion: 'Solución definitiva.' }, 15);
      expect(await database.selectFrom('ticketResoluciones').selectAll().where('idTicket', '=', reopened.idTicket).orderBy('ciclo').execute())
        .toMatchObject([{ ciclo: 1 }, { ciclo: 2 }]);
      expect((await service.detail(owner, numero, time(16))).comentarios.map((item) => item.contenido)).toContain('Solución definitiva.');
    });
    it('el rechazo de una solución mantiene evidencia y abre un nuevo ciclo sin cobrar la espera de confirmación', async () => {
      const owner = await context('ana.managua'); const analyst = await context('analista.managua'); const numero = await create(owner);
      await take(numero, analyst);
      await command(analyst, numero, { accion: 'resolver', version: 3, causa: null, solucion: 'Primer intento de solución.' }, 10);
      await command(owner, numero, { accion: 'rechazar', version: 4, motivo: 'La solución no funcionó' }, 200);
      expect(await row(numero)).toMatchObject({ numeroReaperturas: 1, fechaResolucion: null, fechaPrimeraRespuesta: null, fechaLimiteSolucion: time(320) });
      await service.comment(analyst, numero, { version: 5, visibilidad: 'PUBLICO', contenido: 'Retomamos la atención del caso.' }, time(201));
      expect((await row(numero)).fechaPrimeraRespuesta).toEqual(time(201));
      await command(analyst, numero, { accion: 'resolver', version: 6, causa: null, solucion: 'Segundo intento correcto.' }, 210);
      expect((await row(numero)).slaSolucionCumplido).toBe(true);
    });
    it('escalamiento conserva plazos, pausa detiene y reanudación descuenta minutos del SLA', async () => {
      const owner = await context('ana.managua'); const analyst = await context('analista.managua'); const specialist = await context('especialista.infra'); const numero = await create(owner);
      await take(numero, analyst); const original = await row(numero);
      await command(analyst, numero, { accion: 'escalar', version: 3, idGrupoDestino: 2, idUsuarioDestino: 6, motivo: 'Se requiere especialista' }, 3);
      expect((await row(numero)).fechaLimiteSolucion).toEqual(original.fechaLimiteSolucion);
      await service.attend(specialist, numero, { version: 4 }, time(4));
      expect((await service.lifecycleOptions(specialist, numero, time(4))).acciones).not.toContain('escalar');
      await command(specialist, numero, { accion: 'pausar', version: 5, motivo: 'REPUESTOS', detalle: 'Espera de pieza', referenciaExterna: null }, 5);
      expect(await database.selectFrom('slaAlertas').selectAll().where('idTicket', '=', original.idTicket).where('estado', '=', 'PENDIENTE').execute()).toHaveLength(0);
      await command(specialist, numero, { accion: 'reanudar', version: 6, motivo: 'Pieza recibida' }, 20);
      expect(await row(numero)).toMatchObject({ minutosPausa: 15, fechaLimiteSolucion: time(135), fechaLimiteRespuesta: original.fechaLimiteRespuesta });
      await command(specialist, numero, { accion: 'resolver', version: 7, causa: null, solucion: 'Repuesto instalado.' }, 130);
      expect((await row(numero)).slaSolucionCumplido).toBe(true);
    });
    it('reclasifica solo con justificación, valida activo y recalcula desde el inicio del ciclo', async () => {
      const owner = await context('ana.managua'); const analyst = await context('analista.managua'); const numero = await create(owner);
      const invalid: TicketLifecycleCommand = { accion: 'reclasificar', version: 1, idCategoria: 1, idActivo: null, impacto: 'ALTO', urgencia: 'MEDIA', prioridad: null, justificacionPrioridad: 'Falla de impresión' };
      await expect(command(analyst, numero, invalid, 5)).rejects.toMatchObject({ code: 'ACTIVO_REQUERIDO' });
      await command(analyst, numero, { ...invalid, idActivo: 1 }, 5);
      expect(await row(numero)).toMatchObject({ idPrioridad: 2, prioridadManual: false, fechaLimiteSolucion: time(240) });
      await command(analyst, numero, { ...invalid, version: 2, idActivo: 1, prioridad: 'P1', justificacionPrioridad: 'Impacto crítico documentado' }, 6);
      expect(await row(numero)).toMatchObject({ idPrioridad: 1, prioridadManual: true, fechaLimiteSolucion: time(120) });
    });
    it('aplica segregación, titularidad, permisos y confirmación explícita', async () => {
      const owner = await context('ana.managua'); const analyst = await context('analista.managua'); const auditor = await context('auditor.demo'); const numero = await create(owner);
      await take(numero, analyst);
      await expect(command(owner, numero, { accion: 'resolver', version: 3, causa: null, solucion: 'Autovalidación' }, 3)).rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
      await expect(command(auditor, numero, { accion: 'resolver', version: 3, causa: null, solucion: 'Auditor escribe' }, 3)).rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
      const ownNumero = await create(analyst, 5); await take(ownNumero, analyst);
      await expect(command(analyst, ownNumero, { accion: 'resolver', version: 3, causa: null, solucion: 'Propio requerimiento' }, 3)).rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
      await command(analyst, numero, { accion: 'resolver', version: 3, causa: null, solucion: 'Solución realizada.' }, 4);
      await expect(command(analyst, numero, { accion: 'cerrar', version: 4, confirmacion: true }, 5)).rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
      await expect(command(owner, numero, { accion: 'cerrar', version: 4, confirmacion: false }, 5)).rejects.toThrow();
    });
    it('fuera de cinco días hábiles exige un nuevo ticket relacionado', async () => {
      const owner = await context('ana.managua'); const analyst = await context('analista.managua'); const numero = await create(owner); await take(numero, analyst);
      await command(analyst, numero, { accion: 'resolver', version: 3, causa: null, solucion: 'Solución completa.' }, 10);
      await command(owner, numero, { accion: 'cerrar', version: 4, confirmacion: true }, 11);
      const future = new Date('2026-11-13T14:00:00Z');
      await expect(service.lifecycle(owner, numero, { accion: 'reabrir', version: 5, motivo: 'Fuera de plazo' }, future)).rejects.toMatchObject({ code: 'REAPERTURA_FUERA_PLAZO' });
      expect((await service.lifecycleOptions(owner, numero, future)).requiereTicketNuevo).toBe(true);
      const related = await service.create(owner, { ...payload(), numeroTicketOrigen: numero }, future);
      expect((await row(related.numero)).idTicketOrigen).toBe((await row(numero)).idTicket);
      expect((await service.detail(owner, related.numero, future)).ticket.numeroTicketOrigen).toBe(numero);
    });
    it('cancela solo NUEVO del titular y rechaza otra sede, versión obsoleta y CSRF ausente', async () => {
      const owner = await context('ana.managua'); const analyst = await context('analista.rivas'); const numero = await create(owner);
      await expect(command(analyst, numero, { accion: 'reclasificar', version: 1, idCategoria: 4, idActivo: null, impacto: 'ALTO', urgencia: 'ALTA', prioridad: null, justificacionPrioridad: 'Otra sede' }, 1)).rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
      const login = await authenticated(app, 'ana.managua');
      expect((await app.inject({ method: 'POST', url: `/api/v1/tickets/${numero}/cancelar`, headers: { cookie: login.cookie }, payload: { accion: 'cancelar', version: 1, motivo: 'Duplicado' } })).statusCode).toBe(403);
      await command(owner, numero, { accion: 'cancelar', version: 1, motivo: 'Duplicado' }, 1);
      expect((await row(numero)).fechaCierre).toEqual(time(1));
      await expect(command(owner, numero, { accion: 'cancelar', version: 1, motivo: 'Otra vez' }, 2)).rejects.toMatchObject({ code: 'CONFLICTO_VERSION' });
      await expect(command(owner, numero, { accion: 'cancelar', version: 2, motivo: 'Estado final' }, 2)).rejects.toMatchObject({ code: 'TRANSICION_INVALIDA' });
    });
    it('un fallo de bitácora revierte solución, comentario, estado y versión', async () => {
      const owner = await context('ana.managua'); const analyst = await context('analista.managua'); const numero = await create(owner); await take(numero, analyst);
      const initial = await row(numero);
      await expect(command({ ...analyst, idSesion: '00000000-0000-0000-0000-000000000000' }, numero, { accion: 'resolver', version: 3, causa: null, solucion: 'Debe revertirse.' }, 10)).rejects.toMatchObject({ code: '23503' });
      expect(await row(numero)).toMatchObject({ version: initial.version, fechaResolucion: null });
      expect(await database.selectFrom('ticketResoluciones').selectAll().where('idTicket', '=', initial.idTicket).execute()).toHaveLength(0);
      expect(await database.selectFrom('ticketComentarios').selectAll().where('idTicket', '=', initial.idTicket).execute()).toHaveLength(0);
    });
  });
}
