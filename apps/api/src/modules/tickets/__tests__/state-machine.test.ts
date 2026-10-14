import { describe, expect, it } from 'vitest';
import { validateManualTransition } from '../domain/state-machine.js';

describe('Transiciones manuales determinadas por el catálogo', () => {
  it('deniega transición inexistente o confirmación de solicitante', () => {
    expect(() => validateManualTransition(undefined, ['ticket.atender'], '')).toThrow('Esta transición');
    expect(() => validateManualTransition({ codigo: 'ticket.atender', requiereMotivo: false, requiereConfirmacionSolicitante: true }, ['ticket.atender'], '')).toThrow('Esta transición');
  });
  it('exige el permiso definido por la transición', () => {
    expect(() => validateManualTransition({ codigo: 'ticket.atender', requiereMotivo: false, requiereConfirmacionSolicitante: false }, ['ticket.asignar'], '')).toThrow('No tenés permiso');
  });
  it('exige motivo cuando lo pide el catálogo', () => {
    const transition = { codigo: 'ticket.atender' as const, requiereMotivo: true, requiereConfirmacionSolicitante: false };
    expect(() => validateManualTransition(transition, ['ticket.atender'], '  ')).toThrow('Indicá el motivo');
    expect(() => validateManualTransition(transition, ['ticket.atender'], 'Atención del caso')).not.toThrow();
  });
});
