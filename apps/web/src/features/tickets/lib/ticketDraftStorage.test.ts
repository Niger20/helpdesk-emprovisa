import { describe, expect, it } from 'vitest';
import type { TicketCreate } from '@helpdesk/contracts';
import { clearTicketDraft, readTicketDraft, saveTicketDraft, ticketDraftRetentionMs } from './ticketDraftStorage';

const values: TicketCreate = {
  titulo: 'Sin conexión a red', descripcion: 'No puedo acceder al recurso.', tipo: 'INCIDENTE',
  idCategoria: 1, impacto: 'BAJO', urgencia: 'MEDIA', idActivo: null,
  idSolicitante: 1, canalIngreso: 'PORTAL', numeroTicketOrigen: null,
};
function memoryStorage() {
  const data = new Map<string, string>();
  return { data, getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); } };
}

describe('borradores locales por usuario', () => {
  it('recupera un formulario incompleto tras volver a abrir el almacenamiento', () => {
    const storage = memoryStorage();
    const incomplete = { ...values, titulo: 'Red', descripcion: '', idCategoria: 0 };
    expect(saveTicketDraft(1, incomplete, storage, 100)).toBe(true);
    expect(readTicketDraft(1, storage, 101)).toEqual({ estado: 'recuperado', valores: incomplete });
  });

  it('no recupera el contenido de otro usuario ni lo elimina al limpiar otro usuario', () => {
    const storage = memoryStorage();
    saveTicketDraft(1, values, storage, 100);
    expect(readTicketDraft(2, storage, 101)).toEqual({ estado: 'vacio' });
    clearTicketDraft(2, storage);
    expect(readTicketDraft(1, storage, 101).estado).toBe('recuperado');
  });

  it('rechaza una envoltura con usuario diferente aunque esté en la clave del usuario actual', () => {
    const storage = memoryStorage();
    saveTicketDraft(1, values, storage, 100);
    const [key, raw] = [...storage.data.entries()][0]!;
    storage.setItem(key, raw.replace('"idUsuario":1', '"idUsuario":2'));
    expect(readTicketDraft(1, storage, 101).estado).toBe('descartado');
    expect(storage.data.size).toBe(0);
  });

  it('elimina JSON corrupto y datos de dominio inválidos sin lanzar errores', () => {
    const storage = memoryStorage();
    saveTicketDraft(1, values, storage, 100);
    const key = [...storage.data.keys()][0]!;
    storage.setItem(key, '{');
    expect(readTicketDraft(1, storage, 101).estado).toBe('descartado');
    saveTicketDraft(1, values, storage, 100);
    storage.setItem(key, storage.getItem(key)!.replace('INCIDENTE', 'INVALIDO'));
    expect(readTicketDraft(1, storage, 101).estado).toBe('descartado');
    expect(storage.data.size).toBe(0);
  });

  it('caduca a las 24 horas y rechaza fechas futuras', () => {
    const storage = memoryStorage();
    saveTicketDraft(1, values, storage, 100);
    expect(readTicketDraft(1, storage, 100 + ticketDraftRetentionMs - 1).estado).toBe('recuperado');
    expect(readTicketDraft(1, storage, 100 + ticketDraftRetentionMs).estado).toBe('descartado');
    saveTicketDraft(1, values, storage, 200);
    expect(readTicketDraft(1, storage, 199).estado).toBe('descartado');
  });

  it('limpia el borrador con la misma operación utilizada tras éxito o descarte', () => {
    const storage = memoryStorage();
    saveTicketDraft(1, values, storage, 100);
    expect(clearTicketDraft(1, storage)).toBe(true);
    expect(readTicketDraft(1, storage, 101).estado).toBe('vacio');
  });

  it('no admite credenciales ni adjuntos en el objeto persistido', () => {
    const storage = memoryStorage();
    const unexpected = { ...values, csrfToken: 'secreto', adjuntos: ['archivo'] };
    expect(saveTicketDraft(1, unexpected, storage, 100)).toBe(false);
    expect(storage.data.size).toBe(0);
  });

  it('trata denegación y cuota del navegador como indisponibilidad recuperable', () => {
    const storage = { getItem: () => { throw new Error('Denegado'); },
      setItem: () => { throw new Error('Cuota'); }, removeItem: () => { throw new Error('Denegado'); } };
    expect(readTicketDraft(1, storage).estado).toBe('no-disponible');
    expect(saveTicketDraft(1, values, storage)).toBe(false);
    expect(clearTicketDraft(1, storage)).toBe(false);
  });
});
