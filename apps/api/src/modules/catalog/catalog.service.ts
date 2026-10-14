import { categoryCatalogSchema, categoryInputSchema, categoryParamsSchema, categoryQuerySchema, categoryUpdateSchema } from '@helpdesk/contracts';
import type { CategoryInput, CategoryQuery, CategoryUpdate } from '@helpdesk/contracts';
import type { SessionContext } from '../auth/index.js';
import { AppError } from '../../common/errors/app-error.js';
import { requireCatalogAdmin } from './catalog.policies.js';
import { validateCategoryParent } from './domain/category-tree.js';
import { mapCategory } from './catalog.mapper.js';
import type { CatalogRepository } from './catalog.repository.js';

export function buildCatalogService(repository: CatalogRepository) {
  const detail = async (context: SessionContext | null, id: number) => {
    requireCatalogAdmin(context); categoryParamsSchema.parse({ idCategoria: id }); const row = await repository.find(id);
    if (!row) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró la categoría.');
    return mapCategory(row);
  };
  const save = async (context: SessionContext | null, id: number | null, input: CategoryInput | CategoryUpdate, now = new Date()) => {
    requireCatalogAdmin(context);
    if (id !== null) categoryParamsSchema.parse({ idCategoria: id });
    const data = id === null ? categoryInputSchema.parse(input) : categoryInputSchema.strip().parse(categoryUpdateSchema.parse(input));
    const saved = await repository.atomic(async (repo) => {
      const nodes = await repo.nodes(); const previous = id === null ? null : nodes.find((node) => node.idCategoria === id);
      if (id !== null && !previous) throw new AppError('RECURSO_NO_ENCONTRADO', 404, 'No se encontró la categoría.');
      const oldData = previous ? categoryInputSchema.strip().parse(previous) : null;
      if (id !== null && oldData && 'anterior' in input) {
        const expected = categoryInputSchema.parse(input.anterior);
        if (Object.keys(oldData).some((key) => oldData[key as keyof CategoryInput] !== expected[key as keyof CategoryInput])) {
          throw new AppError('ENTRADA_INVALIDA', 409, 'Otra persona editó la categoría. Recargá antes de guardar.');
        }
      }
      const invalid = validateCategoryParent(nodes, id, data.idPadre, data.activa);
      if (invalid) throw new AppError('ENTRADA_INVALIDA', 400, invalid);
      if (data.idGrupoDefault !== null && !await repo.group(data.idGrupoDefault)) throw new AppError('CATALOGO_INVALIDO', 400, 'Seleccioná un grupo resolutor activo.');
      if (id !== null && oldData && (data.tipoAplicable !== oldData.tipoAplicable || data.requiereActivo !== oldData.requiereActivo) && await repo.referenced(id)) {
        throw new AppError('ENTRADA_INVALIDA', 409, 'Esta categoría tiene tickets. Creá otra para cambiar el tipo o el requisito de activo.');
      }
      if (id !== null) await repo.edit(id, data);
      const categoryId = id ?? (await repo.insert(data)).idCategoria;
      await repo.audit(categoryId, context, data, oldData, now);
      return categoryId;
    });
    return detail(context, saved);
  };
  return { detail, catalogs: async (context: SessionContext | null) => { requireCatalogAdmin(context); return categoryCatalogSchema.parse(await repository.catalogs()); },
    list: async (context: SessionContext | null, input: CategoryQuery) => {
      requireCatalogAdmin(context); const query = categoryQuerySchema.parse(input); const result = await repository.list(query);
      return { data: result.rows.map(mapCategory), meta: { page: query.page, pageSize: query.pageSize, total: result.total } };
    }, create: (context: SessionContext | null, input: CategoryInput) => save(context, null, input),
    edit: (context: SessionContext | null, id: number, input: CategoryUpdate) => save(context, id, input) };
}
export type CatalogService = ReturnType<typeof buildCatalogService>;
