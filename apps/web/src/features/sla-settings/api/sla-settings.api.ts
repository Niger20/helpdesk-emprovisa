import { slaSettingsSchema } from '@helpdesk/contracts';
import type { SlaPriority, SlaPriorityUpdate } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

export const slaSettingsKeys = { all: ['admin-sla'] as const };
export const fetchSlaSettings = () => http('/api/v1/admin/sla', slaSettingsSchema);
export const saveSlaPriority = (codigo: SlaPriority['codigo'], data: SlaPriorityUpdate, csrf: string) =>
  http(`/api/v1/admin/sla/prioridades/${codigo}`, slaSettingsSchema, { method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf }, body: JSON.stringify(data) });
