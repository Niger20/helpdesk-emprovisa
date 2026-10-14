import { describe, expect, it } from 'vitest';
import { selectAutomaticAssignee } from '../domain/automatic-assignment.js';
describe('Selección de responsable: especialidad y carga', () => {
  it('deja el caso en cola cuando no existen candidatos elegibles', () => { expect(selectAutomaticAssignee([])).toBeNull(); });
  it('prioriza menor carga antes de dominio y desempata sin mutar candidatos', () => {
    const candidates = [{ idUsuario: 9, cargaActiva: 3, nivelDominio: 3 }, { idUsuario: 5, cargaActiva: 1, nivelDominio: 1 }];
    expect(selectAutomaticAssignee(candidates)?.idUsuario).toBe(5); expect(candidates[0]?.idUsuario).toBe(9);
  });
  it('con carga igual prioriza dominio y luego identificador estable', () => {
    expect(selectAutomaticAssignee([{ idUsuario: 9, cargaActiva: 0, nivelDominio: 2 },
      { idUsuario: 5, cargaActiva: 0, nivelDominio: 2 }, { idUsuario: 1, cargaActiva: 0, nivelDominio: 1 }])?.idUsuario).toBe(5);
  });
});
