import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { ticketCreateSchema } from '@helpdesk/contracts';
import type { TicketCreate, TicketOptions } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';
import { createTicket, fetchTicketOptions } from '../api/tickets.api';
import { useSearchParams } from 'react-router';
import { useMemo } from 'react';
import { useTicketDraft } from './useTicketDraft';
import { ticketDraftOptionErrors } from '../lib/ticketDraftOptions';

export function useTicketForm(options: TicketOptions) {
  const session = useAuth().data;
  const navigate = useNavigate();
  const client = useQueryClient();
  const [params] = useSearchParams();
  const idUsuario = session?.usuario.idUsuario ?? 0;
  const origen = params.get('origen');
  const defaults = useMemo<TicketCreate>(() => ({
    titulo: '', descripcion: '', tipo: 'INCIDENTE', idCategoria: 0, impacto: 'BAJO', urgencia: 'MEDIA',
    idActivo: null, idSolicitante: idUsuario, canalIngreso: 'PORTAL',
    numeroTicketOrigen: origen,
  }), [idUsuario, origen]);
  const form = useForm<TicketCreate>({ resolver: zodResolver(ticketCreateSchema), mode: 'onBlur', defaultValues: defaults });
  const [tipo, idCategoria, impacto, urgencia, idSolicitante] = useWatch({ control: form.control, name: ['tipo', 'idCategoria', 'impacto', 'urgencia', 'idSolicitante'] });
  const numeroTicketOrigen = useWatch({ control: form.control, name: 'numeroTicketOrigen' });
  const site = options.solicitantes.find((user) => user.idUsuario === idSolicitante)?.idSede;
  const category = options.categorias.find((item) => item.idCategoria === idCategoria);
  const validateOptions = (values: TicketCreate, current: TicketOptions) => {
    const errors = ticketDraftOptionErrors(values, current);
    const fields = Object.keys(errors) as (keyof TicketCreate)[];
    for (const field of fields) {
      const message = errors[field];
      if (message) form.setError(field, { type: 'validate', message });
    }
    if (fields.length > 0) {
      draft.warn(errors.idSolicitante ?? 'Revisá los campos indicados antes de registrar.');
      form.setFocus(fields[0]!);
    }
    return fields.length === 0;
  };
  const mutation = useMutation({ mutationFn: async (values: TicketCreate) => {
    const current = await client.fetchQuery({ queryKey: ['tickets-options'], staleTime: 0,
      queryFn: ({ signal }) => fetchTicketOptions(signal) });
    if (!validateOptions(values, current)) throw new Error('Las opciones del formulario cambiaron. Revisá las selecciones antes de reintentar.');
    return createTicket({ ...values,
    canalIngreso: values.idSolicitante === session?.usuario.idUsuario ? 'PORTAL' : values.canalIngreso,
    }, session?.csrfToken ?? '');
  }, onSuccess: (result) => {
    draft.clear();
    void client.invalidateQueries({ queryKey: ['tickets'] }); void navigate(`/tickets/${result.numero}`);
  } });
  const draft = useTicketDraft(form, defaults, idUsuario, options, mutation.isPending);
  const submit = form.handleSubmit((values) => {
    if (validateOptions(values, options)) mutation.mutate(values);
  });
  return { form, submit, pending: mutation.isPending, error: mutation.error?.message,
    categorias: options.categorias.filter((item) => [tipo, 'AMBOS'].includes(item.tipoAplicable)),
    activos: options.activos.filter((item) => item.idSede === site), requiereActivo: category?.requiereActivo ?? false,
    prioridad: options.matriz.find((item) => item.impacto === impacto && item.urgencia === urgencia)?.prioridad ?? '—',
    tercero: idSolicitante !== session?.usuario.idUsuario, numeroTicketOrigen,
  };
}
