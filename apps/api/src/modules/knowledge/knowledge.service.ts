import { knowledgeCreateSchema, knowledgeUpdateSchema, knowledgeDetailSchema, knowledgeQuerySchema, knowledgeParamsSchema } from '@helpdesk/contracts';
import type { KnowledgeCreate, KnowledgeUpdate, KnowledgeQuery } from '@helpdesk/contracts';
import type { SessionContext } from '../auth/index.js';
import { AppError } from '../../common/errors/app-error.js';
import { knowledgeAccess } from './knowledge.policies.js';
import { mapKnowledge } from './knowledge.mapper.js';
import type { KnowledgeRepository } from './knowledge.repository.js';
import type { FeedbackService } from './feedback.service.js';

export function buildKnowledgeService(repository: KnowledgeRepository, feedback: FeedbackService) {
  const detail = async (context: SessionContext | null, id: number) => {
    const access = knowledgeAccess(context);
    const { idArticulo } = knowledgeParamsSchema.parse({ idArticulo: id });
    const row = await repository.find(idArticulo, access);
    if (!row) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró el artículo.');
    const versions = access.editorial ? await repository.versions(idArticulo) : [];
    return knowledgeDetailSchema.parse({ ...mapKnowledge(row), contenido: row.contenido, revisor: row.revisor,
      versiones: versions.map((version) => ({ ...version, fechaEdicion: version.fechaEdicion.toISOString() })) });
  };
  const save = async (context: SessionContext | null, input: KnowledgeCreate | KnowledgeUpdate, id?: number, now = new Date()) => {
    knowledgeAccess(context, 'kb.editar');
    if (!context) throw new AppError('NO_AUTENTICADO', 401, 'Iniciá sesión para continuar.');
    if (id !== undefined) knowledgeParamsSchema.parse({ idArticulo: id });
    const data = id ? knowledgeUpdateSchema.parse(input) : knowledgeCreateSchema.parse(input);
    const saved = await repository.atomic(async (trx) => {
      if (!await trx.category(data.idCategoria)) throw new AppError('CATALOGO_INVALIDO', 400, 'Seleccioná una categoría activa.');
      let articleId: number;
      let version = 1;
      if (id) {
        const previous = await trx.lock(id);
        if (!previous) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró el artículo.');
        if (!('versionActual' in data) || data.versionActual !== previous.versionActual) {
          throw new AppError('ENTRADA_INVALIDA', 409, 'Otra persona editó el artículo. Recargá la ficha antes de guardar.');
        }
        articleId = id;
        version = previous.versionActual + 1;
        await trx.update(id, data, context, version, now);
      } else { articleId = (await trx.insert(data, context, now)).idArticulo; }
      await trx.version(articleId, data, context, version, now);
      await trx.audit(articleId, context, version, now);
      return articleId;
    });
    return detail(context, saved);
  };
  return { ...feedback, detail, list: async (context: SessionContext | null, query: KnowledgeQuery) => {
    const access = knowledgeAccess(context);
    const input = knowledgeQuerySchema.parse(query);
    const result = await repository.list(input, access);
    return { data: result.rows.map(mapKnowledge), meta: { page: input.page, pageSize: input.pageSize, total: result.total } };
  }, catalogs: (context: SessionContext | null) => { knowledgeAccess(context); return repository.catalogs(); },
  create: (context: SessionContext | null, input: KnowledgeCreate, now?: Date) => save(context, input, undefined, now),
  update: (context: SessionContext | null, id: number, input: KnowledgeUpdate, now?: Date) => save(context, input, id, now) };
}
export type KnowledgeService = ReturnType<typeof buildKnowledgeService>;
