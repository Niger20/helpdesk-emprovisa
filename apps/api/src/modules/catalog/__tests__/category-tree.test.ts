import { describe, expect, it } from 'vitest';
import { validateCategoryParent } from '../domain/category-tree.js';

const nodes = [{ idCategoria: 1, idPadre: null, activa: true }, { idCategoria: 2, idPadre: 1, activa: true },
  { idCategoria: 3, idPadre: 2, activa: true }, { idCategoria: 4, idPadre: null, activa: false }];
describe('Jerarquía de categorías', () => {
  it('permite raíz nueva y antecesoras activas', () => {
    expect(validateCategoryParent(nodes, null, null, true)).toBeNull();
    expect(validateCategoryParent(nodes, null, 3, true)).toBeNull();
  });
  it('rechaza auto referencia y ciclos indirectos', () => {
    expect(validateCategoryParent(nodes, 1, 1, true)).toContain('antecesora');
    expect(validateCategoryParent(nodes, 1, 3, true)).toContain('antecesora');
  });
  it('rechaza referencias inexistentes', () => { expect(validateCategoryParent(nodes, null, 999, true)).toContain('no existe'); });
  it('requiere antecesoras activas al activar', () => {
    expect(validateCategoryParent(nodes, null, 4, true)).toContain('activas');
    expect(validateCategoryParent(nodes, null, 4, false)).toBeNull();
  });
  it('impide desactivar padres con hijos activos y permite hojas', () => {
    expect(validateCategoryParent(nodes, 1, null, false)).toContain('subcategorías');
    expect(validateCategoryParent(nodes, 3, 2, false)).toBeNull();
  });
  it('termina ante ciclos anteriores ajenos al nodo editado', () => {
    expect(validateCategoryParent([{ idCategoria: 1, idPadre: 2, activa: true }, { idCategoria: 2, idPadre: 1, activa: true }], 9, 1, true)).toContain('antecesora');
  });
});
