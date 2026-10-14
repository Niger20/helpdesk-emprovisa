import { hash, argon2id } from 'argon2';
import { DateTime } from 'luxon';
import type { SeedTransaction } from './context.js';
import { demoUsername } from './context.js';

export async function seedIdentity(trx: SeedTransaction, password: string, now: Date) {
  const passwordHash = await hash(password, { type: argon2id });
  const names = ['Administrador de emergencia (demo)', 'Ana López (demo)', 'Carlos Ruiz (demo)',
    'Lucía Martínez (demo)', 'Miguel Pérez (demo)', 'Sofía García (demo)', 'Roberto Castro (demo)',
    'Diego Rodríguez (demo)', 'María Hernández (demo)'];
  const usernames = [demoUsername, 'ana.managua', 'carlos.rivas', 'lucia.leon', 'analista.managua', 'especialista.infra', 'auditor.demo', 'analista.rivas', 'analista.leon'];
  const sites = [1, 1, 2, 3, 1, 1, 1, 2, 3];
  await trx.insertInto('usuarios').values(names.map((nombreCompleto, index) => ({
    idUsuario: index + 1, username: usernames[index] ?? '', nombreCompleto,
    correo: `${usernames[index]}@example.invalid`, idSede: sites[index] ?? 1,
    idDepartamento: sites[index] ?? 1, origenCuenta: 'LOCAL', passwordHash,
    guidDirectorio: null, estado: 'ACTIVO', intentosFallidos: 0,
  }))).execute();
  const roleIds = [4, 1, 1, 1, 2, 3, 5, 2, 2];
  const date = DateTime.fromJSDate(now).setZone('America/Managua').toISODate() ?? '';
  await trx.insertInto('usuarioRol').values(roleIds.map((idRol, index) => ({
    idUsuario: index + 1, idRol, idSedeAlcance: [1, 2].includes(idRol) ? sites[index] ?? 1 : null,
    vigenteDesde: date, asignadoPor: 1,
  }))).execute();
  await trx.insertInto('grupoMiembros').values([
    { idGrupo: 1, idUsuario: 5, esCoordinador: true, desde: date },
    { idGrupo: 2, idUsuario: 6, esCoordinador: true, desde: date },
    { idGrupo: 3, idUsuario: 8, esCoordinador: true, desde: date },
    { idGrupo: 4, idUsuario: 9, esCoordinador: true, desde: date },
  ]).execute();
  await trx.insertInto('usuarioEspecialidad').values([
    { idUsuario: 5, idCategoria: 1, nivelDominio: 1 }, { idUsuario: 6, idCategoria: 3, nivelDominio: 2 },
  ]).execute();
}
