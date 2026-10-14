import { categoryCatalogSchema, categoryInputSchema, categoryListSchema, categorySchema } from '@helpdesk/contracts';
import type { Category, CategoryInput, CategoryQuery } from '@helpdesk/contracts';
import { http } from '../../../lib/http';

const root = '/api/v1/admin/categorias';
export const fetchCategories = (query: CategoryQuery, signal: AbortSignal) => http(`${root}?${new URLSearchParams({
  page: String(query.page), pageSize: String(query.pageSize), q: query.q, estado: query.estado })}`, categoryListSchema, { signal });
export const fetchCategoryCatalog = (signal: AbortSignal) => http(`${root}/catalogos`, categoryCatalogSchema, { signal });
export const saveCategory = (previous: Category | null, data: CategoryInput, csrf: string) => http(previous ? `${root}/${previous.idCategoria}` : root,
  categorySchema, { method: previous ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
    body: JSON.stringify(previous ? { ...data, anterior: categoryInputSchema.strip().parse(previous) } : data) });
