import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Category, CategoryQuery } from '@helpdesk/contracts';
import { fetchCategories, fetchCategoryCatalog } from '../api/catalog.api';

export function useCategories() {
  const [query, setQuery] = useState<CategoryQuery>({ page: 1, pageSize: 20, q: '', estado: 'TODAS' });
  const [selected, setSelected] = useState<Category | null>(null);
  const [notice, setNotice] = useState('');
  const list = useQuery({ queryKey: ['admin-categorias', 'list', query], queryFn: ({ signal }) => fetchCategories(query, signal) });
  const catalog = useQuery({ queryKey: ['admin-categorias', 'catalog'], queryFn: ({ signal }) => fetchCategoryCatalog(signal) });
  return { query, selected, notice, list, catalog,
    setSelected: (category: Category | null) => { setSelected(category); setNotice(''); },
    saved: (category: Category) => { setSelected(category); setNotice('Categoría guardada.'); },
    filter: (value: Partial<CategoryQuery>) => setQuery((current) => ({ ...current, ...value, page: value.page ?? 1 })) };
}
