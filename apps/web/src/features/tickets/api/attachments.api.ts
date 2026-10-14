import { adjuntoSchema, adjuntosSchema } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

const base = (numero: string) => `/api/v1/tickets/${encodeURIComponent(numero)}/adjuntos`;
export const fetchAttachments = (numero: string, signal: AbortSignal) => http(base(numero), adjuntosSchema, { signal });
export const attachmentUrl = (numero: string, idAdjunto: number) => `${base(numero)}/${idAdjunto}`;
export function uploadAttachment(numero: string, archivo: File, csrfToken: string) {
  const body = new FormData(); body.append('archivo', archivo);
  return http(base(numero), adjuntoSchema, { method: 'POST', headers: { 'X-CSRF-Token': csrfToken }, body });
}
