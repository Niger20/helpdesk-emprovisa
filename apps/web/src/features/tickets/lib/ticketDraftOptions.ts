import type { TicketCreate, TicketOptions } from '@helpdesk/contracts';

export function ticketDraftOptionErrors(values: TicketCreate, options: TicketOptions) {
  const errors: Partial<Record<keyof TicketCreate, string>> = {};
  const requester = options.solicitantes.find((item) => item.idUsuario === values.idSolicitante);
  const category = options.categorias.find((item) => item.idCategoria === values.idCategoria
    && [values.tipo, 'AMBOS'].includes(item.tipoAplicable));
  if (!requester) errors.idSolicitante = 'Seleccioná un solicitante disponible.';
  if (!category) errors.idCategoria = 'Seleccioná una categoría disponible para este tipo.';
  if (values.idActivo !== null && !options.activos.some((item) => item.idActivo === values.idActivo && item.idSede === requester?.idSede)) {
    errors.idActivo = 'Seleccioná un activo disponible de la sede del solicitante.';
  } else if (category?.requiereActivo && values.idActivo === null) {
    errors.idActivo = 'Esta categoría requiere seleccionar un activo.';
  }
  return errors;
}

export function reconcileTicketDraft(values: TicketCreate, options: TicketOptions, idUsuario: number): TicketCreate {
  const errors = ticketDraftOptionErrors(values, options);
  const result = { ...values,
    idSolicitante: errors.idSolicitante ? idUsuario : values.idSolicitante,
    idCategoria: errors.idCategoria ? 0 : values.idCategoria,
    idActivo: errors.idActivo ? null : values.idActivo,
  };
  if (result.idSolicitante === idUsuario) result.canalIngreso = 'PORTAL';
  return result;
}
