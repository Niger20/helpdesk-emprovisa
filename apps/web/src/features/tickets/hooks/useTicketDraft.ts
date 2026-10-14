import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { TicketCreate, TicketOptions } from '@helpdesk/contracts';
import { TicketDraftContext } from '../lib/ticketDraftContext';
import { clearTicketDraft, readTicketDraft, saveTicketDraft } from '../lib/ticketDraftStorage';
import { reconcileTicketDraft } from '../lib/ticketDraftOptions';

export function useTicketDraft(form: UseFormReturn<TicketCreate>, defaults: TicketCreate,
  idUsuario: number, options: TicketOptions, pending: boolean) {
  const report = useContext(TicketDraftContext);
  const [message, setMessage] = useState('El borrador se guardará automáticamente al editar.');
  const initialized = useRef<number | null>(null);
  const stopped = useRef(false);
  const clear = useCallback(() => {
    stopped.current = true;
    try { return clearTicketDraft(idUsuario, window.localStorage); } catch { return false; }
  }, [idUsuario]);
  const discard = useCallback(() => {
    const removed = clear();
    form.reset(defaults);
    stopped.current = false;
    setMessage(removed ? 'Borrador descartado. El formulario está vacío.'
      : 'No se pudo eliminar el borrador del navegador. El formulario está vacío.');
  }, [clear, defaults, form]);

  useEffect(() => {
    if (!idUsuario || initialized.current === idUsuario) return;
    initialized.current = idUsuario;
    stopped.current = true;
    form.reset(defaults);
    try {
      const draft = readTicketDraft(idUsuario, window.localStorage);
      if (draft.estado === 'recuperado') {
        const recovered = reconcileTicketDraft(draft.valores, options, idUsuario);
        form.reset({ ...recovered, numeroTicketOrigen: defaults.numeroTicketOrigen ?? recovered.numeroTicketOrigen });
        setMessage('Borrador recuperado. Revisá las selecciones y el contenido antes de registrar.');
      } else if (draft.estado === 'descartado') {
        setMessage('Se descartó un borrador vencido o inválido. Podés iniciar uno nuevo.');
      } else if (draft.estado === 'no-disponible') {
        setMessage('El almacenamiento local no está disponible. El borrador no sobrevivirá al cerrar esta página.');
      }
    } catch {
      setMessage('El almacenamiento local no está disponible. El borrador no sobrevivirá al cerrar esta página.');
    }
    stopped.current = false;
  }, [defaults, form, idUsuario, options]);

  useEffect(() => {
    const subscription = form.watch(() => {
      if (stopped.current || !idUsuario || initialized.current !== idUsuario) return;
      let saved = false;
      try { saved = saveTicketDraft(idUsuario, form.getValues(), window.localStorage); } catch { saved = false; }
      setMessage(saved ? 'Borrador guardado en este navegador.'
        : 'No se pudo guardar el borrador local. Mantené esta página abierta para conservar el contenido.');
    });
    return () => { subscription.unsubscribe(); };
  }, [form, idUsuario]);

  useEffect(() => { report?.({ message, discard, pending }); }, [discard, message, pending, report]);
  return { clear, warn: setMessage };
}
