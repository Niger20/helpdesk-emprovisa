import { verify } from 'argon2';
import { describe, expect, it } from 'vitest';
import { estadoTicketSchema } from '@helpdesk/contracts';
import type { Database } from '../src/infra/db/client.js';
import { seedDemo } from '../src/infra/db/seeds/demo.seed.js';
import { demoPassword, demoUsername } from '../src/infra/db/seeds/context.js';

export function seedChecks(database: Database) {
  describe('Seed de demostración', () => {
    it('incluye las tres sedes, nueve usuarios y los nueve estados', async () => {
      expect(await database.selectFrom('sedes').selectAll().execute()).toHaveLength(3);
      expect(await database.selectFrom('usuarios').select('idUsuario').execute()).toHaveLength(9);
      const states = await database.selectFrom('tickets').innerJoin('estadosTicket', 'estadosTicket.idEstado', 'tickets.idEstado')
        .select('estadosTicket.codigo').execute();
      expect(states.map((state) => state.codigo).sort()).toEqual([...estadoTicketSchema.options].sort());
    });
    it('los nueve perfiles del prototipo son locales y tienen contraseña Argon2id', async () => {
      const users = await database.selectFrom('usuarios').selectAll().where('origenCuenta', '=', 'LOCAL').execute();
      expect(users).toHaveLength(9);
      const admin = users.find((user) => user.username === demoUsername);
      expect(admin?.username).toBe(demoUsername);
      expect(admin?.passwordHash).toMatch(/^\$argon2id\$/);
      expect(await verify(admin?.passwordHash ?? '', demoPassword)).toBe(true);
    });
    it('el auditor solo tiene lectura, exportación y verificación', async () => {
      const permissions = await database.selectFrom('rolPermiso')
        .innerJoin('roles', 'roles.idRol', 'rolPermiso.idRol')
        .innerJoin('permisos', 'permisos.idPermiso', 'rolPermiso.idPermiso')
        .select('permisos.accion').where('roles.codigo', '=', 'AUDITOR').execute();
      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions.every((permission) => ['sesion', 'ver', 'exportar', 'verificar'].includes(permission.accion) || permission.accion.startsWith('ver_'))).toBe(true);
    });
    it('no permite resolver el ticket del propio solicitante', async () => {
      await expect(database.insertInto('ticketResoluciones').values({
        idTicket: 1, ciclo: 1, idResolutor: 3, solucion: 'Prueba prohibida', fechaResolucion: new Date(),
      }).execute()).rejects.toMatchObject({ code: '23514' });
    });
    it('el hardware no admite quitar el activo requerido', async () => {
      await expect(database.updateTable('tickets').set({ idActivo: null }).where('idTicket', '=', 1).execute())
        .rejects.toMatchObject({ code: '23514' });
    });
    it('el cambio manual de prioridad requiere justificación', async () => {
      await expect(database.updateTable('tickets').set({ prioridadManual: true, justificacionPrioridad: null }).where('idTicket', '=', 1).execute())
        .rejects.toMatchObject({ code: '23514' });
    });
    it('la matriz coincide con la prioridad almacenada en cada ticket', async () => {
      const rows = await database.selectFrom('tickets').innerJoin('matrizPrioridad', (join) => join
        .onRef('matrizPrioridad.impacto', '=', 'tickets.impacto').onRef('matrizPrioridad.urgencia', '=', 'tickets.urgencia'))
        .select(['tickets.idPrioridad as ticket', 'matrizPrioridad.idPrioridad as matriz']).execute();
      expect(rows).toHaveLength(9);
      expect(rows.every((row) => row.ticket === row.matriz)).toBe(true);
    });
    it('una segunda ejecución no duplica datos ni cambia la contraseña', async () => {
      expect(await seedDemo(database, 'OtraClaveDePrueba')).toBe('YA_EXISTE');
      const user = await database.selectFrom('usuarios').select('passwordHash').where('username', '=', demoUsername).executeTakeFirstOrThrow();
      expect(await verify(user.passwordHash ?? '', demoPassword)).toBe(true);
      expect(await database.selectFrom('tickets').select('idTicket').execute()).toHaveLength(9);
    });
    it('las secuencias continúan después de los identificadores de la seed', async () => {
      const row = await database.insertInto('tiposActivo').values({ nombre: 'Prueba secuencia', familia: 'PRUEBA' }).returning('idTipoActivo').executeTakeFirstOrThrow();
      expect(row.idTipoActivo).toBeGreaterThan(2);
      await database.deleteFrom('tiposActivo').where('idTipoActivo', '=', row.idTipoActivo).execute();
    });
  });
}
