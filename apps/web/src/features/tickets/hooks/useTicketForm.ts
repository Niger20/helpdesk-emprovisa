import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { ticketCreateSchema } from '@helpdesk/contracts';
import type { TicketCreate, TicketOptions } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';
import { createTicket } from '../api/tickets.api';
import { useSearchParams } from 'react-router';

export function useTicketForm(options: TicketOptions) {
  const session = useAuth().data;
  const navigate = useNavigate();
  const client = useQueryClient();
  const [params] = useSearchParams();
  const form = useForm<TicketCreate>({ resolver: zodResolver(ticketCreateSchema), mode: 'onBlur', defaultValues: {
    titulo: '', descripcion: '', tipo: 'INCIDENTE', idCategoria: 0, impacto: 'BAJO', urgencia: 'MEDIA',
    idActivo: null, idSolicitante: session?.usuario.idUsuario ?? 0, canalIngreso: 'PORTAL',
    numeroTicketOrigen: params.get('origen'),
  } });
  const [tipo, idCategoria, impacto, urgencia, idSolicitante] = useWatch({ control: form.control, name: ['tipo', 'idCategoria', 'impacto', 'urgencia', 'idSolicitante'] });
  const numeroTicketOrigen = useWatch({ control: form.control, name: 'numeroTicketOrigen' });
  const site = options.solicitantes.find((user) => user.idUsuario === idSolicitante)?.idSede;
  const category = options.categorias.find((item) => item.idCategoria === idCategoria);
  const mutation = useMutation({ mutationFn: (values: TicketCreate) => createTicket({ ...values,
    canalIngreso: values.idSolicitante === session?.usuario.idUsuario ? 'PORTAL' : values.canalIngreso,
  }, session?.csrfToken ?? ''), onSuccess: (result) => {
    void client.invalidateQueries({ queryKey: ['tickets'] }); void navigate(`/tickets/${result.numero}`);
  } });
  return { form, submit: form.handleSubmit((values) => { mutation.mutate(values); }), pending: mutation.isPending, error: mutation.error?.message,
    categorias: options.categorias.filter((item) => [tipo, 'AMBOS'].includes(item.tipoAplicable)),
    activos: options.activos.filter((item) => item.idSede === site), requiereActivo: category?.requiereActivo ?? false,
    prioridad: options.matriz.find((item) => item.impacto === impacto && item.urgencia === urgencia)?.prioridad ?? '—',
    tercero: idSolicitante !== session?.usuario.idUsuario, numeroTicketOrigen,
  };
}
