import { DateTime } from 'luxon';
import type { SeedTransaction } from './context.js';

export async function seedAssets(trx: SeedTransaction, now: Date) {
  await trx.insertInto('tiposActivo').values([
    { idTipoActivo: 1, nombre: 'Impresora', familia: 'HARDWARE' },
    { idTipoActivo: 2, nombre: 'Cámara CCTV', familia: 'HARDWARE' },
  ]).execute();
  const date = DateTime.fromJSDate(now).setZone('America/Managua').toISODate() ?? '';
  await trx.insertInto('activosTi').values([
    { idActivo: 1, codigoPatrimonial: 'EMP-IMP-0142', idTipoActivo: 1, marca: 'HP', modelo: 'LaserJet (demo)', descripcion: 'Impresora de Operaciones Managua', idSede: 1, idCustodio: 2, estado: 'ACTIVO', actaNumero: 'F-ACT-01-DEMO-001' },
    { idActivo: 2, codigoPatrimonial: 'EMP-CAM-0031', idTipoActivo: 2, marca: 'Hikvision', modelo: 'CCTV (demo)', descripcion: 'Cámara de acceso principal Rivas', idSede: 2, idCustodio: 3, estado: 'MANTENIMIENTO', actaNumero: 'F-ACT-01-DEMO-002' },
    { idActivo: 3, codigoPatrimonial: 'EMP-IMP-0075', idTipoActivo: 1, marca: 'Epson', modelo: 'EcoTank (demo)', descripcion: 'Impresora de Operaciones León', idSede: 3, idCustodio: 4, estado: 'ACTIVO', actaNumero: 'F-ACT-01-DEMO-003' },
  ]).execute();
  await trx.insertInto('activoCustodiaHistorial').values([1, 2, 3].map((idActivo) => ({
    idActivo, idUsuario: idActivo + 1, desde: date, registradoPor: 6, actaNumero: `F-ACT-01-DEMO-00${idActivo}`,
  }))).execute();
}
