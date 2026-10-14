import { prioridadSchema, slaPriorityUpdateSchema } from '@helpdesk/contracts';
import type { SlaPriorityUpdate } from '@helpdesk/contracts';
import type { z } from 'zod';
import type { SessionContext } from '../../auth/index.js';
import { AppError } from '../../../common/errors/app-error.js';
import { requireSlaAdmin } from './sla.policies.js';
import { mapSlaSettings } from './sla.mapper.js';
import type { SlaSettingsRepository } from './sla.repository.js';

export function buildSlaSettingsService(repository: SlaSettingsRepository) {
  return {
    list: async (context: SessionContext | null) => {
      requireSlaAdmin(context);
      return repository.atomic(async (repo) => mapSlaSettings(await repo.read()));
    },
    edit: async (context: SessionContext | null, code: z.infer<typeof prioridadSchema>, input: SlaPriorityUpdate, now = new Date()) => {
      requireSlaAdmin(context);
      const codigo = prioridadSchema.parse(code); const data = slaPriorityUpdateSchema.parse(input);
      return repository.atomic(async (repo) => {
        const previous = mapSlaSettings(await repo.read());
        if (previous.revision !== data.revisionAnterior) throw new AppError('ENTRADA_INVALIDA', 409, 'La configuración cambió. Recargá antes de guardar.');
        const priority = previous.prioridades.find((row) => row.codigo === codigo);
        if (!priority) throw new AppError('ENTRADA_INVALIDA', 404, 'La prioridad solicitada no está configurada.');
        if (priority.nombre === data.nombre) return previous;
        await repo.rename(codigo, data.nombre);
        await repo.audit(codigo, priority.nombre, data.nombre, context, now);
        return mapSlaSettings(await repo.read());
      });
    },
  };
}
export type SlaSettingsService = ReturnType<typeof buildSlaSettingsService>;
