import { createSurveyForClosedTicket } from '../../modules/surveys/index.js';
import type { DatabaseExecutor } from '../db/client.js';

export interface SurveyInvitation { enlace: string; expiraEn: string }
export interface SurveyDelivery {
  issue: (executor: DatabaseExecutor, idTicket: number, now: Date) => Promise<SurveyInvitation | null>;
  deliver: (idUsuario: number, numero: string, invitation: SurveyInvitation) => void;
}
export const surveyIssuer: SurveyDelivery = { issue: createSurveyForClosedTicket, deliver: () => {} };
export function createDemoSurveyDelivery() {
  const invitations = new Map<string, { idUsuario: number; numero: string; enlace: string; expiraEn: string }>();
  const clean = (now: Date) => { for (const [key, value] of invitations) if (new Date(value.expiraEn) <= now) invitations.delete(key); };
  return { ...surveyIssuer,
    deliver: (idUsuario: number, numero: string, invitation: SurveyInvitation) => {
      clean(new Date());
      invitations.set(numero, { idUsuario, numero, enlace: invitation.enlace, expiraEn: invitation.expiraEn });
    },
    list: (idUsuario: number, now = new Date()) => {
      clean(now);
      return [...invitations.values()].filter((value) => value.idUsuario === idUsuario).map(({ numero, enlace, expiraEn }) => ({ numero, enlace, expiraEn }));
    },
  };
}
