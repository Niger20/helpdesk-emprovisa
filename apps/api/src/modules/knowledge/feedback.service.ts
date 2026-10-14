import { knowledgeVoteSchema, knowledgeLinkSchema, knowledgeLinkParamsSchema, knowledgeParamsSchema } from '@helpdesk/contracts';
import type { KnowledgeVote, KnowledgeLink } from '@helpdesk/contracts';
import type { Database } from '../../infra/db/client.js';
import type { SessionContext } from '../auth/index.js';
import { authorizeKnowledgeTicket, requireTicketPermission } from '../tickets/index.js';
import { AppError } from '../../common/errors/app-error.js';
import { knowledgeAccess } from './knowledge.policies.js';
import type { FeedbackRepository } from './feedback.repository.js';

export function buildFeedbackService(database: Database, repository: FeedbackRepository) {
  const article = async (repo: Pick<FeedbackRepository, 'lock'>, context: SessionContext | null, id: number, published = false) => {
    const access = knowledgeAccess(context);
    knowledgeParamsSchema.parse({ idArticulo: id });
    const row = await repo.lock(id);
    if (!row || (!access.editorial && row.estado !== 'PUBLICADO') || (!access.internal && row.visibilidad !== 'PUBLICO')) {
      throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró el artículo.');
    }
    if (published && row.estado !== 'PUBLICADO') throw new AppError('ENTRADA_INVALIDA', 409, 'Esta acción requiere un artículo publicado.');
  };
  return {
    feedback: async (context: SessionContext | null, id: number) => {
      requireTicketPermission(context, 'kb.ver');
      return repository.atomic(async (repo) => {
        await article(repo, context, id);
        return { ...await repo.counts(id), miVoto: await repo.vote(id, context.usuario.idUsuario) ?? null };
      });
    },
    vote: async (context: SessionContext | null, id: number, input: KnowledgeVote, now = new Date()) => {
      knowledgeAccess(context);
      requireTicketPermission(context, 'ticket.crear');
      const data = knowledgeVoteSchema.parse(input);
      return repository.atomic(async (repo) => {
        await article(repo, context, id, true);
        const previous = await repo.vote(id, context.usuario.idUsuario);
        if (previous?.util === data.util && previous.comentario === data.comentario) return { actualizado: false };
        await repo.saveVote(id, context.usuario.idUsuario, data, now);
        await repo.audit(id, 'KB_VOTO', context, now);
        return { actualizado: true };
      });
    },
    links: async (context: SessionContext | null, id: number) => {
      knowledgeAccess(context);
      requireTicketPermission(context, 'ticket.ver');
      return repository.atomic(async (repo) => {
        await article(repo, context, id);
        const data = [];
        for (const row of await repo.links(id)) {
          try { await authorizeKnowledgeTicket(database, repo.executor, context, row.numero); }
          catch (error) { if (error instanceof AppError && error.code === 'RECURSO_NO_ENCONTRADO') continue; throw error; }
          data.push({ ...row, fecha: row.fecha.toISOString() });
        }
        return { data };
      });
    },
    link: async (context: SessionContext | null, id: number, input: KnowledgeLink, remove = false, now = new Date()) => {
      knowledgeAccess(context);
      requireTicketPermission(context, 'ticket.atender');
      const data = knowledgeLinkSchema.parse(input);
      knowledgeLinkParamsSchema.parse({ idArticulo: id, numero: data.numero });
      return repository.atomic(async (repo) => {
        const ticket = await authorizeKnowledgeTicket(database, repo.executor, context, data.numero, true);
        await article(repo, context, id, !remove);
        const previous = await repo.link(id, ticket.idTicket);
        if ((remove && !previous) || (!remove && previous?.uso === data.uso)) return { actualizado: false };
        if (remove) await repo.removeLink(id, ticket.idTicket);
        else await repo.saveLink(id, ticket.idTicket, data, context, now);
        await repo.audit(id, remove ? 'KB_DESVINCULADO' : 'KB_VINCULADO', context, now, ticket.idTicket);
        return { actualizado: true };
      });
    },
  };
}
export type FeedbackService = ReturnType<typeof buildFeedbackService>;
