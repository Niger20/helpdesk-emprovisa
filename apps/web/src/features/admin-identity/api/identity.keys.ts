export const identityKeys = { all: ['admin-identity'] as const, users: (page: number, q: string) => ['admin-identity', 'usuarios', page, q] as const,
  groups: (page: number) => ['admin-identity', 'grupos', page] as const, catalog: ['admin-identity', 'catalogos'] as const,
  roles: ['admin-identity', 'roles'] as const, links: (id: number) => ['admin-identity', 'usuario', id, 'roles'] as const,
  specialties: (id: number) => ['admin-identity', 'usuario', id, 'especialidades'] as const,
  members: (id: number) => ['admin-identity', 'grupo', id, 'miembros'] as const };
