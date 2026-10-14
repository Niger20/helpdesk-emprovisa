import { automationStatusSchema, notificationListSchema, surveyInvitationsSchema } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

export const fetchNotifications = (page: number, signal: AbortSignal) => http(`/api/v1/notificaciones?page=${page}&pageSize=20`, notificationListSchema, { signal });
export const fetchAutomations = (signal: AbortSignal) => http('/api/v1/tareas', automationStatusSchema, { signal });
export const fetchInvitations = (signal: AbortSignal) => http('/api/v1/encuestas/invitaciones', surveyInvitationsSchema, { signal });
