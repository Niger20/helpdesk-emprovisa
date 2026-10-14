import { createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export type TicketDraftStatus = { message: string; discard: () => void; pending: boolean };
export const TicketDraftContext = createContext<Dispatch<SetStateAction<TicketDraftStatus | null>> | null>(null);
