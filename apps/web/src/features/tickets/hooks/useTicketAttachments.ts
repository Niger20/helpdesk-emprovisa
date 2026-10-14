import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adjuntoUploadSchema } from '@helpdesk/contracts';
import type { EstadoTicket } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';
import { fetchAttachments, uploadAttachment } from '../api/attachments.api';

export function useTicketAttachments(numero: string, estado: EstadoTicket) {
  const session = useAuth().data; const client = useQueryClient();
  const [inputKey, setInputKey] = useState(0);
  const query = useQuery({ queryKey: ['ticket-adjuntos', numero], queryFn: ({ signal }) => fetchAttachments(numero, signal) });
  const form = useForm<{ archivo: File }>({ resolver: zodResolver(adjuntoUploadSchema) });
  const upload = useMutation({ mutationFn: ({ archivo }: { archivo: File }) => uploadAttachment(numero, archivo, session?.csrfToken ?? ''),
    onSuccess: async () => {
      form.reset(); setInputKey((value) => value + 1);
      await Promise.all([client.invalidateQueries({ queryKey: ['ticket-adjuntos', numero] }), client.invalidateQueries({ queryKey: ['ticket', numero] }),
        client.invalidateQueries({ queryKey: ['ticket-operacion', numero] }), client.invalidateQueries({ queryKey: ['ticket-ciclo', numero] })]);
    },
  });
  const select = (file: File | undefined) => {
    upload.reset();
    if (!file) { form.reset(); return; }
    form.setValue('archivo', file, { shouldValidate: true });
    if (query.data && file.size > query.data.maximoBytes) form.setError('archivo', { message: 'El archivo supera el límite permitido.' });
  };
  const submit = form.handleSubmit((data) => {
    if (query.data && data.archivo.size > query.data.maximoBytes) { form.setError('archivo', { message: 'El archivo supera el límite permitido.' }); return; }
    upload.mutate(data);
  });
  return { query, upload, form, select, submit, inputKey, canUpload: Boolean(session?.usuario.permisos.includes('ticket.adjuntar')) && !['CERRADO', 'CANCELADO'].includes(estado) };
}
