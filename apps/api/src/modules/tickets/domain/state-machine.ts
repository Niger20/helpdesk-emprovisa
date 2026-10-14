import type { Permiso } from '@helpdesk/contracts';
import { AppError } from '../../../common/errors/app-error.js';

export interface StateTransition { codigo: Permiso; requiereMotivo: boolean; requiereConfirmacionSolicitante: boolean }
export function validateManualTransition(transition: StateTransition | undefined, permissions: readonly Permiso[], motivo: string, confirmacionSolicitante = false) {
  if (!transition || (transition.requiereConfirmacionSolicitante && !confirmacionSolicitante)) throw new AppError('TRANSICION_INVALIDA', 409, 'Esta transición no está disponible.');
  if (!permissions.includes(transition.codigo)) throw new AppError('NO_AUTORIZADO', 403, 'No tenés permiso para esta transición.');
  if (transition.requiereMotivo && !motivo.trim()) throw new AppError('ENTRADA_INVALIDA', 400, 'Indicá el motivo de la transición.');
}
