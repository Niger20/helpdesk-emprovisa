import { estadoTicketSchema, impactoSchema, prioridadSchema, rolSchema, urgenciaSchema } from '@helpdesk/contracts';
import type { SeedTransaction } from './context.js';

export async function seedCatalog(trx: SeedTransaction, now: Date) {
  await trx.insertInto('calendariosLaborales').values({ idCalendario: 1, nombre: 'Calendario de demostración', zonaHoraria: 'America/Managua' }).execute();
  await trx.insertInto('horariosLaborales').values([1, 2, 3, 4, 5].map((diaSemanas) => ({
    idCalendario: 1, diaSemana: diaSemanas, horaInicio: '08:00:00', horaFin: '17:00:00',
  }))).execute();
  await trx.insertInto('sedes').values(['Managua', 'Rivas', 'León'].map((ciudad, index) => ({
    idSede: index + 1, codigo: ['MGA', 'RIV', 'LEO'][index] ?? '', nombre: `Sede ${ciudad}`, ciudad, idCalendario: 1, activa: true,
  }))).execute();
  await trx.insertInto('departamentos').values([1, 2, 3].map((idSede) => ({ idDepartamento: idSede, idSede, nombre: 'Operaciones' }))).execute();
  await trx.insertInto('roles').values(rolSchema.options.map((codigo, index) => ({ idRol: index + 1, codigo, nombre: codigo.replaceAll('_', ' '), esSistema: true }))).execute();
  await trx.insertInto('gruposResolutores').values([
    { idGrupo: 1, nombre: 'Mesa de ayuda Managua', nivel: 1, idSede: 1, activo: true },
    { idGrupo: 2, nombre: 'Infraestructura multisede', nivel: 2, activo: true },
    { idGrupo: 3, nombre: 'Mesa de ayuda Rivas', nivel: 1, idSede: 2, activo: true },
    { idGrupo: 4, nombre: 'Mesa de ayuda León', nivel: 1, idSede: 3, activo: true },
  ]).execute();
  await trx.insertInto('categorias').values([
    { idCategoria: 1, nombre: 'Impresora sin conexión', tipoAplicable: 'INCIDENTE', requiereActivo: true, idGrupoDefault: 1, orden: 1, activa: true },
    { idCategoria: 2, nombre: 'Alta de usuario en dominio', tipoAplicable: 'SOLICITUD', requiereActivo: false, idGrupoDefault: 1, orden: 2, activa: true },
    { idCategoria: 3, nombre: 'Falla de cámara CCTV', tipoAplicable: 'INCIDENTE', requiereActivo: true, idGrupoDefault: 2, orden: 3, activa: true },
    { idCategoria: 4, nombre: 'Correo no sincroniza', tipoAplicable: 'INCIDENTE', requiereActivo: false, idGrupoDefault: 1, orden: 4, activa: true },
  ]).execute();
  await trx.insertInto('estadosTicket').values(estadoTicketSchema.options.map((codigo, index) => ({
    idEstado: index + 1, codigo, nombre: codigo.replaceAll('_', ' '),
    esFinal: ['CERRADO', 'CANCELADO'].includes(codigo),
    relojCorre: ['NUEVO', 'ASIGNADO', 'EN_ATENCION', 'ESCALADO', 'REABIERTO'].includes(codigo), orden: index + 1,
  }))).execute();
  const response = [15, 30, 120, 240];
  const solution = [120, 240, 480, 1440];
  await trx.insertInto('prioridadesSla').values(prioridadSchema.options.map((codigo, index) => ({
    idPrioridad: index + 1, codigo, nombre: ['Crítica', 'Alta', 'Media', 'Baja'][index] ?? '',
    minutosRespuesta: response[index] ?? 0, minutosSolucion: solution[index] ?? 0,
    modoCalendario: index < 2 ? 'CONTINUO' : 'LABORAL', porcentajeAlerta: 50,
    colorHex: ['#DC2626', '#F59E0B', '#13315C', '#475569'][index] ?? '', activa: true,
  }))).execute();
  const matrix = [[1, 2, 3], [2, 3, 3], [3, 4, 4]];
  await trx.insertInto('matrizPrioridad').values(impactoSchema.options.flatMap((impacto, i) =>
    urgenciaSchema.options.map((urgencia, j) => ({ impacto, urgencia, idPrioridad: matrix[i]?.[j] ?? 4 })))).execute();
  await trx.insertInto('parametros').values([
    { clave: 'sesion.inactividad_minutos', valor: '30', tipoDato: 'ENTERO', modificadoEn: now },
    { clave: 'ticket.cierre_inactividad_horas', valor: '48', tipoDato: 'ENTERO', modificadoEn: now },
  ]).execute();
}
