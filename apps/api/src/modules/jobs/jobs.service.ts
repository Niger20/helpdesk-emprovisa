import { DateTime } from 'luxon';
import { automationStatusSchema, jobCodeSchema } from '@helpdesk/contracts';
import type { JobCode } from '@helpdesk/contracts';
import type { JobsRepository } from './jobs.repository.js';
import type { SessionContext } from '../auth/index.js';
import { AppError } from '../../common/errors/app-error.js';
import type { DatabaseExecutor } from '../../infra/db/client.js';
import { surveyIssuer } from '../../infra/mail/survey-delivery.js';
import type { SurveyDelivery, SurveyInvitation } from '../../infra/mail/survey-delivery.js';

type Atomic = <T>(action: (repo: JobsRepository) => Promise<T>) => Promise<T>;
export function createJobsService(repository: JobsRepository, atomic: Atomic, dispatch: (executor: DatabaseExecutor, now: Date) => Promise<void>, ingest: (executor: DatabaseExecutor, now: Date) => Promise<void>, delivery: SurveyDelivery = surveyIssuer) {
  const run = async (input: JobCode, now = new Date()) => {
    const codigo = jobCodeSchema.parse(input);
    const invitations: { idUsuario: number; numero: string; invitation: SurveyInvitation }[] = [];
    try {
      await atomic(async (repo) => {
        const task = await repo.task(codigo);
        if (!task?.activa) return;
        let partial = false;
        if (codigo === 'sla-threshold') {
          for (const row of await repo.dueAlerts(now)) {
            await repo.fireAlert(row.idAlerta, now);
            await repo.log(row.idTicket, task.idTarea, 'ALERTA_SLA', { ciclo: row.cicloSla, tipo: 'UMBRAL_50' }, now);
          }
        } else if (codigo === 'sla-breach-escalation') {
          for (const row of await repo.overdue(now)) {
            if (row.estado === 'ESCALADO') {
              await repo.log(row.idTicket, task.idTarea, 'ESCALAMIENTO', { ciclo: row.numeroReaperturas + 1, motivo: 'Sin primera atención en el grupo N2; aviso a jefatura' }, now);
              continue;
            }
            const transition = await repo.transition(row.idEstado, 'ESCALADO');
            const target = await repo.escalationTarget(row.idSede, row.idSolicitante, DateTime.fromJSDate(now).setZone('America/Managua').toISODate() ?? '');
            if (!transition || !target) {
              partial = true;
              if (!await repo.missingTargetLogged(row.idTicket, row.numeroReaperturas + 1)) await repo.log(row.idTicket, task.idTarea, 'ALERTA_SLA', { ciclo: row.numeroReaperturas + 1, motivo: 'SIN_DESTINO_N2' }, now);
              continue;
            }
            await repo.escalate(row.idTicket, transition.idEstado, target.idGrupo, target.idUsuario, await repo.level(row.idGrupo), now);
            await repo.log(row.idTicket, task.idTarea, 'ESCALAMIENTO', { ciclo: row.numeroReaperturas + 1, idAsignado: target.idUsuario, idGrupo: target.idGrupo }, now);
            await repo.log(row.idTicket, task.idTarea, 'CAMBIO_ESTADO', { estado: 'ESCALADO' }, now);
          }
        } else if (codigo === 'auto-close-resolved') {
          const hours = await repo.closeHours();
          if (!Number.isInteger(hours) || hours < 1 || hours > 8760) throw new Error('Parámetro de cierre inválido.');
          for (const row of await repo.resolved(now, hours)) {
            const transition = await repo.transition(row.idEstado, 'CERRADO');
            if (!transition) throw new Error('No hay transición automática de cierre.');
            await repo.close(row.idTicket, transition.idEstado, now);
            await repo.log(row.idTicket, task.idTarea, 'CIERRE', { motivo: `Cierre por ${hours} horas de inactividad` }, now);
            await repo.log(row.idTicket, task.idTarea, 'CAMBIO_ESTADO', { estado: 'CERRADO' }, now);
            const invitation = await delivery.issue(repo.executor, row.idTicket, now);
            if (invitation) invitations.push({ idUsuario: row.idSolicitante, numero: row.numero, invitation });
          }
        } else if (codigo === 'audit-chain-verify') await repo.integrity();
        else if (codigo === 'notification-dispatch') await dispatch(repo.executor, now);
        else if (codigo === 'mail-ingest') await ingest(repo.executor, now);
        await repo.taskResult(task.idTarea, now, partial ? 'PARCIAL' : 'CORRECTO');
      });
      for (const entry of invitations) delivery.deliver(entry.idUsuario, entry.numero, entry.invitation);
    } catch (error) {
      await atomic(async (repo) => { const task = await repo.task(codigo); if (task) await repo.taskResult(task.idTarea, now, 'ERROR'); });
      throw error;
    }
  };
  return { run, schedules: repository.tasks,
    status: async (context: SessionContext | null) => {
      if (!context?.grants.some((grant) => grant.codigo === 'auditoria.ver' && grant.idSedeAlcance === null)) throw new AppError('NO_AUTORIZADO', 403, 'No podés consultar las tareas automáticas.');
      const tareas = (await repository.tasks()).map((row) => ({ ...row, ultimaEjecucion: row.ultimaEjecucion?.toISOString() ?? null }));
      return automationStatusSchema.parse({ tareas, notificaciones: await repository.notificationsSummary(), simulada: true });
    },
  };
}
