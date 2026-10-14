import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { useAuth } from '../../../hooks/useAuth';
import { SessionPanel } from '../../../features/auth';

export function AppShell({ children }: { children: ReactNode }) {
  const session = useAuth().data;
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="bg-primary p-5 text-primary-foreground"><p className="text-lg font-bold">EMPROVISA · Mesa de Ayuda</p><p className="mt-1 text-sm">{session?.usuario.nombreCompleto} · {session?.usuario.sede.nombre}</p></header>
      <div className="mx-auto grid max-w-7xl gap-6 p-4 md:grid-cols-[210px_minmax(0,1fr)] md:p-6">
        <aside className="min-w-0"><nav aria-label="Navegación" className="mb-6 flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3 md:flex-col">
          <NavLink to="/tickets" className="min-h-10 rounded px-3 py-2 text-sm font-semibold">Tickets</NavLink>
          {session?.usuario.permisos.includes('activo.ver') && <NavLink to="/activos" className="min-h-10 rounded px-3 py-2 text-sm font-semibold">Inventario</NavLink>}
          {session?.usuario.permisos.includes('kb.ver') && <NavLink to="/conocimientos" className="min-h-10 rounded px-3 py-2 text-sm font-semibold">Conocimientos</NavLink>}
          <NavLink to="/disponibilidad" className="min-h-10 rounded px-3 py-2 text-sm">Servicio</NavLink>
        </nav><SessionPanel /></aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
