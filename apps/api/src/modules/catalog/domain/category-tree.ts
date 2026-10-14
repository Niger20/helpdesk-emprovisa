export interface CategoryNode { idCategoria: number; idPadre: number | null; activa: boolean }

export function validateCategoryParent(nodes: readonly CategoryNode[], id: number | null, parent: number | null, active: boolean) {
  const visited = new Set<number>();
  if (id !== null) visited.add(id);
  let current = parent;
  while (current !== null) {
    if (visited.has(current)) return 'La categoría no puede ser su propia antecesora.';
    visited.add(current);
    const node = nodes.find((item) => item.idCategoria === current);
    if (!node) return 'La categoría superior no existe.';
    if (active && !node.activa) return 'Una categoría activa requiere antecesoras activas.';
    current = node.idPadre;
  }
  if (!active && id !== null && nodes.some((node) => node.idPadre === id && node.activa)) {
    return 'Desactivá o trasladá las subcategorías activas primero.';
  }
  return null;
}
