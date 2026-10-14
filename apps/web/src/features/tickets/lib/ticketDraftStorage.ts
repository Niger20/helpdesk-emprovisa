import type { TicketCreate } from '@helpdesk/contracts';
import { ticketDraftSchema, ticketDraftValuesSchema } from '../schemas/ticketDraft';

export const ticketDraftRetentionMs = 24 * 60 * 60 * 1000;
type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const key = (idUsuario: number) => `helpdesk:ticket-draft:v1:${idUsuario}`;

export function clearTicketDraft(idUsuario: number, storage?: DraftStorage): boolean {
  try { (storage ?? window.localStorage).removeItem(key(idUsuario)); return true; } catch { return false; }
}

export function readTicketDraft(idUsuario: number, storage: DraftStorage, now = Date.now()) {
  let raw: string | null;
  try { raw = storage.getItem(key(idUsuario)); } catch { return { estado: 'no-disponible' as const }; }
  if (!raw) return { estado: 'vacio' as const };
  try {
    const parsed = ticketDraftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || parsed.data.idUsuario !== idUsuario || parsed.data.guardadoEn > now
      || now - parsed.data.guardadoEn >= ticketDraftRetentionMs) {
      clearTicketDraft(idUsuario, storage);
      return { estado: 'descartado' as const };
    }
    return { estado: 'recuperado' as const, valores: parsed.data.valores };
  } catch {
    clearTicketDraft(idUsuario, storage);
    return { estado: 'descartado' as const };
  }
}

export function saveTicketDraft(idUsuario: number, valores: TicketCreate, storage: DraftStorage, now = Date.now()) {
  const parsed = ticketDraftValuesSchema.safeParse(valores);
  if (!parsed.success) return false;
  try {
    storage.setItem(key(idUsuario), JSON.stringify({ version: 1, idUsuario, guardadoEn: now, valores: parsed.data }));
    return true;
  } catch { return false; }
}
