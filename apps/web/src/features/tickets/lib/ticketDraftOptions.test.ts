import { describe, expect, it } from 'vitest';
import type { TicketCreate, TicketOptions } from '@helpdesk/contracts';
import { reconcileTicketDraft, ticketDraftOptionErrors } from './ticketDraftOptions';

const options: TicketOptions = {
  solicitantes: [{ idUsuario: 1, nombreCompleto: 'Usuario local', idSede: 1 }],
  categorias: [{ idCategoria: 1, nombre: 'Hardware', tipoAplicable: 'INCIDENTE', requiereActivo: true }],
  activos: [{ idActivo: 1, codigoPatrimonial: 'EMP-001', idSede: 1 },
    { idActivo: 2, codigoPatrimonial: 'EMP-002', idSede: 2 }], matriz: [],
};
const values: TicketCreate = {
  titulo: 'Sin conexión a red', descripcion: 'Sin conexión.', tipo: 'INCIDENTE',
  idCategoria: 1, impacto: 'BAJO', urgencia: 'MEDIA', idActivo: 1,
  idSolicitante: 1, canalIngreso: 'PORTAL', numeroTicketOrigen: null,
};

describe('selecciones de borrador y opciones vigentes', () => {
  it('conserva selecciones todavía disponibles', () => {
    expect(reconcileTicketDraft(values, options, 1)).toEqual(values);
    expect(ticketDraftOptionErrors(values, options)).toEqual({});
  });

  it('elimina solicitante, activo y categoría que ya no están disponibles', () => {
    const recovered = reconcileTicketDraft({ ...values, idSolicitante: 99, idCategoria: 99, idActivo: 99,
      canalIngreso: 'TELEFONO' }, options, 1);
    expect(recovered).toEqual({ ...values, idCategoria: 0, idActivo: null });
    expect(recovered.titulo).toBe(values.titulo);
  });

  it('impide enviar un activo de otra sede y exige activo para hardware', () => {
    expect(ticketDraftOptionErrors({ ...values, idActivo: 2 }, options)).toHaveProperty('idActivo');
    expect(ticketDraftOptionErrors({ ...values, idActivo: null }, options)).toHaveProperty('idActivo');
    expect(reconcileTicketDraft({ ...values, idActivo: 2 }, options, 1).idActivo).toBeNull();
  });

  it('impide enviar solicitante retirado o categoría incompatible después de recuperar', () => {
    expect(ticketDraftOptionErrors(values, { ...options, solicitantes: [] })).toHaveProperty('idSolicitante');
    expect(ticketDraftOptionErrors({ ...values, tipo: 'SOLICITUD' }, options)).toHaveProperty('idCategoria');
  });
});
