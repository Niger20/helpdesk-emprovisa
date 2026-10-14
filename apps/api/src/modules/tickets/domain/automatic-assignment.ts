export interface AssignmentCandidate { idUsuario: number; cargaActiva: number; nivelDominio: number }
export function selectAutomaticAssignee(candidates: readonly AssignmentCandidate[]) {
  return [...candidates].sort((left, right) => left.cargaActiva - right.cargaActiva
    || right.nivelDominio - left.nivelDominio || left.idUsuario - right.idUsuario)[0] ?? null;
}
